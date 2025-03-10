import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JoinRoomComponent } from './join-room.component';
import { FormsModule } from '@angular/forms';
import { SocketService } from '@app/services/code/socket.service';
import { Subject } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('JoinRoomComponent', () => {
    let component: JoinRoomComponent;
    let fixture: ComponentFixture<JoinRoomComponent>;
    let socketServiceMock: jasmine.SpyObj<SocketService>;

    beforeEach(async () => {
        socketServiceMock = jasmine.createSpyObj('SocketService', ['joinRoom', 'onPlayerJoined', 'onJoinError']);
        socketServiceMock.onPlayerJoined.and.returnValue(new Subject());
        socketServiceMock.onJoinError.and.returnValue(new Subject());

        await TestBed.configureTestingModule({
            declarations: [JoinRoomComponent],
            imports: [FormsModule],
            providers: [{ provide: SocketService, useValue: socketServiceMock }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(JoinRoomComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('devrait créer la composante', () => {
        expect(component).toBeTruthy();
    });

    it('devrait invalider un code de moins de 4 chiffres', () => {
        component.accessCode = '123';
        component.validateCode();
        expect(component.isValidCode).toBeFalse();
    });

    it('devrait invalider un code de plus de 4 chiffres', () => {
        component.accessCode = '12345';
        component.validateCode();
        expect(component.isValidCode).toBeFalse();
    });

    it('devrait valider un code de 4 chiffres', () => {
        component.accessCode = '1234';
        component.validateCode();
        expect(component.isValidCode).toBeTrue();
    });

    it('devrait désactiver le bouton si le code est invalide', () => {
        component.accessCode = '12';
        component.validateCode();
        fixture.detectChanges();

        const button = fixture.debugElement.query(By.css('button')).nativeElement;
        expect(button.disabled).toBeTrue();
    });

    it('devrait activer le bouton si le code est valide', () => {
        component.accessCode = '1234';
        component.validateCode();
        fixture.detectChanges();

        const button = fixture.debugElement.query(By.css('button')).nativeElement;
        expect(button.disabled).toBeFalse();
    });

    it('devrait appeler socketService.joinRoom() si le code est valide', () => {
        component.accessCode = '1234';
        component.isValidCode = true;
        component.joinRoom();
        expect(socketServiceMock.joinRoom).toHaveBeenCalledWith('1234');
    });

    // it('devrait afficher un message de succès si la connexion réussit', () => {
    //     const joinSubject = new Subject<void>();
    //     socketServiceMock.onPlayerJoined.and.returnValue(joinSubject);

    //     component.accessCode = '1234';
    //     component.isValidCode = true;
    //     component.joinRoom();
    //     joinSubject.next();

    //     expect(component.joinResult).toBe('Salle 1234 rejointe');
    //     expect(component.showCharacterForm).toBeTrue();
    // });

    it('devrait afficher un message d’erreur si la salle n’existe pas', () => {
        const errorSubject = new Subject<{ message: string }>();
        socketServiceMock.onJoinError.and.returnValue(errorSubject);

        component.accessCode = '9999';
        component.isValidCode = true;
        component.joinRoom();
        errorSubject.next({ message: 'Salle inexistante' });

        expect(component.joinResult).toBe('Salle inexistante');
        expect(component.showCharacterForm).toBeFalse();
    });

    it('devrait cacher le formulaire de personnage quand closeCharacterForm() est appelé', () => {
        component.showCharacterForm = true;
        component.closeCharacterForm();
        expect(component.showCharacterForm).toBeFalse();
    });
});
