/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { MockSocketService } from '@app/helpers/mockSocketService';
import { SocketService } from '@app/services/code/socket.service';
import { JoinRoomComponent } from './join-room.component';

describe('JoinRoomComponent', () => {
    let component: JoinRoomComponent;
    let fixture: ComponentFixture<JoinRoomComponent>;
    let socketServiceMock: MockSocketService;

    beforeEach(async () => {
        socketServiceMock = new MockSocketService();

        await TestBed.configureTestingModule({
            imports: [FormsModule, JoinRoomComponent],
            // Utiliser le type SocketService comme token :
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

    // it('devrait désactiver le bouton si le code est invalide', () => {
    //     component.accessCode = '12';
    //     component.validateCode();
    //     fixture.detectChanges();

    //     const button = fixture.debugElement.query(By.css('button')).nativeElement;
    //     expect(button.disabled).toBeTrue();
    // });

    it('devrait activer le bouton si le code est valide', () => {
        component.accessCode = '1234';
        component.validateCode();
        fixture.detectChanges();

        const button = fixture.debugElement.query(By.css('button')).nativeElement;
        expect(button.disabled).toBeFalse();
    });

    it('devrait appeler socketService.joinRoom() si le code est valide', () => {
        spyOn(socketServiceMock, 'joinRoom');
        component.accessCode = '1234';
        component.isValidCode = true;
        component.joinRoom();
        expect(socketServiceMock.joinRoom).toHaveBeenCalledWith('1234');
    });

    it('ne devrait pas appeler socketService.joinRoom() si le code est invalide', () => {
        spyOn(socketServiceMock, 'joinRoom');
        component.accessCode = '12';
        component.isValidCode = false;
        component.joinRoom();
        expect(socketServiceMock.joinRoom).not.toHaveBeenCalled();
    });

    it('devrait afficher un message de succès si la connexion réussit', () => {
        component.accessCode = '1234';
        component.isValidCode = true;
        component.joinRoom();

        // Simuler l’événement de succès de connexion
        socketServiceMock.triggerPlayerJoined({ room: { players: [] } });
        fixture.detectChanges();

        expect(component.joinResult).toBe('Salle 1234 rejointe');
        expect(component.showCharacterForm).toBeTrue();
    });

    it('devrait afficher un message d’erreur si la salle n’existe pas', () => {
        component.accessCode = '9999';
        component.isValidCode = true;
        component.joinRoom();

        // Simuler l’événement d’erreur
        socketServiceMock.triggerJoinError({ message: 'Salle inexistante' });
        fixture.detectChanges();

        expect(component.joinResult).toBe('Salle inexistante');
        expect(component.showCharacterForm).toBeFalse();
    });

    it('devrait cacher le formulaire de personnage quand closeCharacterForm() est appelé', () => {
        component.showCharacterForm = true;
        component.closeCharacterForm();
        expect(component.showCharacterForm).toBeFalse();
    });
});
