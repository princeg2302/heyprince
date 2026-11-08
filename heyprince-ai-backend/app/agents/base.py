from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseAgent(ABC):
    def __init__(self, agent_id: str = "agent", name: Optional[str] = None):
        self.agent_id = agent_id
        self.name = name or agent_id

    @abstractmethod
    async def execute(self, trigger: str = "manual", payload: Optional[Dict[str, Any]] = None, **kwargs) -> Dict[str, Any]:
        """Executes the autonomous agent's specific workflow."""
        pass
