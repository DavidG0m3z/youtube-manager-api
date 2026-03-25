import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { google } from 'googleapis';
import { UsersRepository } from '../auth/users.repository';

@Injectable()
export class GoogleService {
  private readonly logger = new Logger(GoogleService.name);
  private oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL,
  );

  constructor(private readonly usersRepository: UsersRepository) {}

  getAuthUrl(userId: number) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/youtube.readonly'],
      state: String(userId),
    });
  }

  async handleCallback(code: string, state: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    const userId = Number(state);
    await this.saveTokens(userId, tokens);
  }

  async saveTokens(userId: number, tokens: any) {
    await this.usersRepository.update(userId, {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleExpiryDate: tokens.expiry_date,
    });
    this.logger.log(`Tokens saved for user ${userId}`);
  }

  async getAuthorizedClient(userId: number) {
    const user = await this.usersRepository.findById(userId);
    if (!user || !user.googleAccessToken) {
      throw new UnauthorizedException('Google account not connected');
    }

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL,
    );

    client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
      expiry_date: user.googleExpiryDate,
    });

    // Check if token is expired and refresh if necessary
    client.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        await this.saveTokens(userId, tokens);
      }
    });

    return client;
  }
}
