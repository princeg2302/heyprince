import { NextResponse } from 'next/server';
import { supabase } from '@/lib/admin-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('name, role, avatar_url')
      .order('id', { ascending: true })
      .limit(1)
      .single();

    if (!error && user) {
      return NextResponse.json(
        {
          name: user.name || 'Prince',
          role: user.role === 'admin' ? 'Senior Full Stack Engineer & IT Consultant' : user.role,
          avatar:
            user.avatar_url ||
            'https://muzbzrxwbanzsjvgtexp.supabase.co/storage/v1/object/public/media/1791537029941-author.jpg',
        },
        {
          headers: {
            'Cache-Control': 'no-store, max-age=0, must-revalidate',
          },
        }
      );
    }
  } catch (err) {
    console.warn('[/api/author] Error fetching dynamic author:', err);
  }

  return NextResponse.json(
    {
      name: 'Prince',
      role: 'Senior Full Stack Engineer & IT Consultant',
      avatar: 'https://muzbzrxwbanzsjvgtexp.supabase.co/storage/v1/object/public/media/1791537029941-author.jpg',
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    }
  );
}

