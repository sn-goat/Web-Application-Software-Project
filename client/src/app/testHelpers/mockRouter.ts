export class MockRouter {
    navigate = jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true));
}
