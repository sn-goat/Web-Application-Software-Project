/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { MockSocketService } from '@app/helpers/mockSocketService';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { IRoom } from '@common/game';
import { JoinRoomComponent } from './join-room.component';

describe('JoinRoomComponent', () => {
    let component: JoinRoomComponent;
    let fixture: ComponentFixture<JoinRoomComponent>;
    let socketServiceMock: MockSocketService;

    beforeEach(async () => {
        socketServiceMock = new MockSocketService();

        await TestBed.configureTestingModule({
            imports: [FormsModule, JoinRoomComponent],
            providers: [
                { provide: SocketEmitterService, useValue: socketServiceMock },
                { provide: SocketReceiverService, useValue: socketServiceMock },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(JoinRoomComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should invalidate a code with less than 4 digits', () => {
        component.accessCode = '123';
        component.validateCode();
        expect(component.isValidCode).toBeFalse();
    });

    it('should invalidate a code with more than 4 digits', () => {
        component.accessCode = '12345';
        component.validateCode();
        expect(component.isValidCode).toBeFalse();
    });

    it('should validate a code with exactly 4 digits', () => {
        component.accessCode = '1234';
        component.validateCode();
        expect(component.isValidCode).toBeTrue();
    });

    it('should enable the button if the code is valid', () => {
        component.accessCode = '1234';
        component.validateCode();
        fixture.detectChanges();

        const button = fixture.debugElement.query(By.css('button')).nativeElement;
        expect(button.disabled).toBeFalse();
    });

    it('should call socketService.joinRoom() if the code is valid', () => {
        spyOn(socketServiceMock, 'joinRoom');
        component.accessCode = '1234';
        component.isValidCode = true;
        component.joinRoom();
        expect(socketServiceMock.joinRoom).toHaveBeenCalledWith('1234');
    });

    it('should not call socketService.joinRoom() if the code is invalid', () => {
        spyOn(socketServiceMock, 'joinRoom');
        component.accessCode = '12';
        component.isValidCode = false;
        component.joinRoom();
        expect(socketServiceMock.joinRoom).not.toHaveBeenCalled();
    });

    it('should display a success message if the connection is successful', () => {
        component.accessCode = '1234';
        component.isValidCode = true;
        component.joinRoom();

        // Simulate success event
        socketServiceMock.triggerPlayerJoined({ accessCode: '1234' } as IRoom);
        fixture.detectChanges();

        expect(component.joinResult).toBe('Salle 1234 rejointe');
        expect(component.showCharacterForm).toBeTrue();
    });

    it('should display an error message if the room does not exist', () => {
        component.accessCode = '9999';
        component.isValidCode = true;
        component.joinRoom();

        // Simulate error event
        socketServiceMock.triggerJoinError('Salle inexistante');
        fixture.detectChanges();

        expect(component.joinResult).toBe('Salle inexistante');
        expect(component.showCharacterForm).toBeFalse();
    });

    it('should hide the character form when closeCharacterForm() is called', () => {
        component.showCharacterForm = true;
        component.closeCharacterForm();
        expect(component.showCharacterForm).toBeFalse();
    });
});
