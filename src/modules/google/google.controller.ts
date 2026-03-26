import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { GoogleService } from './google.service';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/common/guards/roles.guards';
import { Role } from '../auth/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import type { Response } from 'express';

@Controller('google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Roles(Role.ADMIN)
  @Get('connect')
  async connect(@Req() req) {
    const url = this.googleService.getAuthUrl(req.user.id);
    return { url };
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      throw new UnauthorizedException('Invalid callback parameters');
    }

    try {
      await this.googleService.handleCallback(code, state);
      //  Redirigir al frontend
      return res.redirect(
        `${process.env.URL_FRONT}/redirect-google?success=true&code=${code}&state=${state}`,
      );
    } catch (error) {
      return res
        .status(500)
        .send('Error vinculando la cuenta de Google: ' + error.message);
    }
  }

  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Roles(Role.ADMIN)
  @Get('account/unlink')
  async unlink(@Req() req) {
    console.log(req.user);
    await this.googleService.unlinkAccount(req.user.id);
    return { message: 'Cuenta de Google desvinculada correctamente' };
  }
}
