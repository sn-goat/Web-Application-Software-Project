/* eslint-disable @typescript-eslint/ban-types */
export class FakeSocket {
    callbacks: { [event: string]: Function } = {};
    onceCallbacks: { [event: string]: Function } = {};

    emit = jasmine.createSpy('emit');
    id = 'fakeSocketId';

    on(event: string, callback: Function) {
        this.callbacks[event] = callback;
    }

    once(event: string, callback: Function) {
        this.onceCallbacks[event] = callback;
    }
}
