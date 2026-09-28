import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';

import { adminUsers } from '@server/database/schema';

export interface AdminSessionUser {
  id: string;
  username: string;
}

interface AdminSession {
  user?: AdminSessionUser;
  destroy(callback: (err: unknown) => void): void;
}

const PBKDF2_ITERATIONS = 10000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';

function hashPassword(password: string, salt: string): string {
  return crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString('hex');
}

function verifyPassword(password: string, passwordHash: string): boolean {
  const parts = passwordHash.split('$');
  let salt: string;
  let storedHash: string;
  if (parts.length === 3 && parts[0] === 'pbkdf2_sha512') {
    [, salt, storedHash] = parts;
  } else if (parts.length === 2) {
    [salt, storedHash] = parts;
  } else {
    return false;
  }
  if (salt.length !== 32 || storedHash.length !== 128) return false;

  const derived = hashPassword(password, salt);
  const derivedBuf = Buffer.from(derived, 'hex');
  const storedBuf = Buffer.from(storedHash, 'hex');
  if (derivedBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derivedBuf, storedBuf);
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async validateUser(
    username: string,
    password: string,
  ): Promise<AdminSessionUser | null> {
    const users = await this.db
      .select({
        id: adminUsers.id,
        username: adminUsers.username,
        passwordHash: adminUsers.passwordHash,
        isActive: adminUsers.isActive,
      })
      .from(adminUsers)
      .where(eq(adminUsers.username, username))
      .limit(1);

    if (users.length === 0) return null;
    const user = users[0];

    if (!user.isActive) return null;
    if (!verifyPassword(password, user.passwordHash)) return null;

    return { id: user.id, username: user.username };
  }

  async login(
    username: string,
    password: string,
    session: AdminSession,
  ): Promise<AdminSessionUser> {
    const user = await this.validateUser(username, password);
    if (!user) {
      this.logger.warn(`Login failed for username: ${username}`);
      throw new UnauthorizedException('用户名或密码错误');
    }

    await this.db
      .update(adminUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(adminUsers.id, user.id));

    session.user = { id: user.id, username: user.username };
    this.logger.log(`User logged in: ${username}`);
    return user;
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('新密码长度不能少于6位');
    }

    const users = await this.db
      .select({
        id: adminUsers.id,
        username: adminUsers.username,
        passwordHash: adminUsers.passwordHash,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, userId))
      .limit(1);

    if (users.length === 0) {
      throw new BadRequestException('用户不存在');
    }
    const user = users[0];

    if (!verifyPassword(oldPassword, user.passwordHash)) {
      throw new BadRequestException('旧密码不正确');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(newPassword, salt);
    const fullHash = `pbkdf2_sha512$${salt}$${hash}`;

    await this.db
      .update(adminUsers)
      .set({ passwordHash: fullHash })
      .where(eq(adminUsers.id, userId));

    this.logger.log(`Password changed for user: ${user.username}`);
  }

  async changeUsername(
    userId: string,
    newUsername: string,
    password: string,
  ): Promise<void> {
    if (!newUsername || newUsername.length < 3 || newUsername.length > 50) {
      throw new BadRequestException('用户名长度必须在3-50个字符之间');
    }

    const users = await this.db
      .select({
        id: adminUsers.id,
        username: adminUsers.username,
        passwordHash: adminUsers.passwordHash,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, userId))
      .limit(1);

    if (users.length === 0) {
      throw new BadRequestException('用户不存在');
    }
    const user = users[0];

    if (!verifyPassword(password, user.passwordHash)) {
      throw new BadRequestException('密码不正确');
    }

    if (user.username === newUsername) {
      throw new BadRequestException('新用户名不能与当前用户名相同');
    }

    const existing = await this.db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.username, newUsername))
      .limit(1);

    if (existing.length > 0 && existing[0].id !== userId) {
      throw new BadRequestException('该用户名已被占用');
    }

    await this.db
      .update(adminUsers)
      .set({ username: newUsername })
      .where(eq(adminUsers.id, userId));

    this.logger.log(`Username changed for user: ${user.username} -> ${newUsername}`);
  }

  async logout(session: AdminSession): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      session.destroy((err: unknown) => {
        if (err) {
          this.logger.error(`Session destroy failed: ${JSON.stringify(err)}`);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  getCurrentUser(session: AdminSession): AdminSessionUser | null {
    if (!session.user) return null;
    return { id: session.user.id, username: session.user.username };
  }
}
