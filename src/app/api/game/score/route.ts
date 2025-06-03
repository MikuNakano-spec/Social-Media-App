import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/auth';

export async function PATCH(req: NextRequest) {
  const { user } = await validateRequest();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { score } = await req.json();
    console.log(`User ${user.id} scored ${score} (not stored)`);

    return NextResponse.json({
      message: 'Score received but not stored (no DB tracking)',
      score,
    });
  } catch (error) {
    console.error('Score handling error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
