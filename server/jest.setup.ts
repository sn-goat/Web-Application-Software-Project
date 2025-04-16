import { Logger } from '@nestjs/common';

jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
jest.spyOn(Logger.prototype, 'verbose').mockImplementation(() => undefined);

jest.spyOn(Logger, 'log').mockImplementation(() => undefined);
jest.spyOn(Logger, 'error').mockImplementation(() => undefined);
jest.spyOn(Logger, 'warn').mockImplementation(() => undefined);
jest.spyOn(Logger, 'debug').mockImplementation(() => undefined);
jest.spyOn(Logger, 'verbose').mockImplementation(() => undefined);
