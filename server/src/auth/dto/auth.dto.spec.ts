import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';

describe('authentication DTOs', () => {
  it('normalizes registration identity', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: '  Jane Doe  ',
      email: ' JANE@EXAMPLE.COM ',
      password: 'StrongPass1!',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({ name: 'Jane Doe', email: 'jane@example.com' });
  });

  it('rejects weak passwords', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password',
    });
    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('normalizes login email', async () => {
    const dto = plainToInstance(LoginDto, {
      email: ' USER@EXAMPLE.COM ',
      password: 'anything',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.email).toBe('user@example.com');
  });
});
