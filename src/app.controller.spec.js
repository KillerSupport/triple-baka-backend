const { Test } = require('@nestjs/testing');
const { AppController } = require('./app.controller');
const { AppService } = require('./app.service');

test('GET / retains the existing greeting', async () => {
  const module = await Test.createTestingModule({
    controllers: [AppController],
    providers: [AppService],
  }).compile();
  expect(module.get(AppController).getHello()).toBe('Hello World!');
  await module.close();
});
