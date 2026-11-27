import time
import unittest
from types import SimpleNamespace

from starlette.requests import Request
from fastapi import HTTPException

from app.core import security


class InternalAuthTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.original_settings = security.settings
        security.settings = SimpleNamespace(DEBUG=False, AI_SERVICE_SECRET="unit-test-secret")

    def tearDown(self):
        security.settings = self.original_settings

    def make_request(self, headers, body=b'{"hello":"world"}', method="POST", path="/api/v1/chief/run-agent"):
        raw_headers = [(key.lower().encode(), value.encode()) for key, value in headers.items()]
        scope = {
            "type": "http",
            "http_version": "1.1",
            "method": method,
            "scheme": "https",
            "path": path,
            "raw_path": path.encode(),
            "query_string": b"",
            "headers": raw_headers,
            "server": ("testserver", 443),
            "client": ("127.0.0.1", 12345),
        }
        sent = False

        async def receive():
            nonlocal sent
            if sent:
                return {"type": "http.request", "body": b"", "more_body": False}
            sent = True
            return {"type": "http.request", "body": body, "more_body": False}

        return Request(scope, receive)

    async def test_accepts_nextjs_signature_contract(self):
        body = b'{"hello":"world"}'
        timestamp = str(int(time.time() * 1000))
        message = f"POST:/api/v1/chief/run-agent:{timestamp}:{body.decode()}"
        signature = security.compute_hmac("unit-test-secret", message)
        request = self.make_request({"X-Timestamp": timestamp, "X-Signature": signature}, body)
        self.assertTrue(await security.verify_internal_auth(request))

    async def test_rejects_missing_signature(self):
        request = self.make_request({})
        with self.assertRaises(HTTPException) as error:
            await security.verify_internal_auth(request)
        self.assertEqual(error.exception.status_code, 401)

    async def test_rejects_expired_timestamp(self):
        timestamp = str(int(time.time() * 1000) - 600_000)
        request = self.make_request({"X-Timestamp": timestamp, "X-Signature": "bad"})
        with self.assertRaises(HTTPException) as error:
            await security.verify_internal_auth(request)
        self.assertEqual(error.exception.status_code, 401)

    async def test_fails_closed_without_service_secret(self):
        security.settings = SimpleNamespace(DEBUG=False, AI_SERVICE_SECRET="")
        request = self.make_request({})
        with self.assertRaises(HTTPException) as error:
            await security.verify_internal_auth(request)
        self.assertEqual(error.exception.status_code, 503)


if __name__ == "__main__":
    unittest.main()
