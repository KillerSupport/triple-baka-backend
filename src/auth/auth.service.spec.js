const bcrypt = require('bcrypt');
const { AuthService } = require('./auth.service');

test('registration hashes the password, normalizes email and ignores client roles', async () => {
  const users = {
    findOneBy: jest.fn().mockResolvedValue(null),
    create: (user) => user,
    save: jest.fn(async (user) => ({ ...user, UserID: 17 })),
  };
  const auth = new AuthService(users, {});
  const Password = 'test only password';
  const result = await auth.register({
    FullName: ' Test Customer ',
    Email: ' Customer@Example.Test ',
    Password,
    Role: 'admin',
  });

  const [saved] = users.save.mock.calls[0];
  expect(await bcrypt.compare(Password, saved.Password)).toBe(true);
  expect(result.user).toEqual({
    UserID: 17,
    FullName: 'Test Customer',
    Email: 'customer@example.test',
    Role: 'customer',
  });
});

test('registration rejects invalid input before accessing the repository', async () => {
  const users = { findOneBy: jest.fn() };
  const auth = new AuthService(users, {});
  await expect(auth.register({ Email: 'bad' })).rejects.toMatchObject({
    status: 400,
  });
  expect(users.findOneBy).not.toHaveBeenCalled();
});

test('login throttles one address after twenty attempts within a minute', async () => {
  const auth = new AuthService({}, {});
  for (let attempt = 0; attempt < 20; attempt++) {
    await expect(auth.login({}, '127.0.0.1')).rejects.toMatchObject({
      status: 400,
    });
  }
  await expect(auth.login({}, '127.0.0.1')).rejects.toMatchObject({
    status: 429,
  });
  await expect(auth.login({}, '127.0.0.2')).rejects.toMatchObject({
    status: 400,
  });
});
