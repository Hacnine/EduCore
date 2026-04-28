import { Controller, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@Request() req) {
    return this.usersService.findById(req.user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateMe(@Request() req, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user.userId, dto);
  }

  @Get('me/enrollments')
  @ApiOperation({ summary: 'Get current user enrollments' })
  getMyEnrollments(@Request() req) {
    return this.usersService.getEnrollments(req.user.userId);
  }

  @Get('me/certificates')
  @ApiOperation({ summary: 'Get current user certificates' })
  getMyCertificates(@Request() req) {
    return this.usersService.getCertificates(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public user profile' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
