/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FightLogicService } from '@app/services/fight-logic/fight-logic.service';
import { PlayerService } from '@app/services/player/player.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { IFight } from '@common/game';
import { IPlayer } from '@common/player';
import { BehaviorSubject, of } from 'rxjs';
import { GameFightInterfaceComponent } from './game-fight-interface.component';

describe('GameFightInterfaceComponent', () => {
    let component: GameFightInterfaceComponent;
    let fixture: ComponentFixture<GameFightInterfaceComponent>;
    let fightLogicService: jasmine.SpyObj<FightLogicService>;
    let playerService: jasmine.SpyObj<PlayerService>;

    beforeEach(async () => {
        const fightLogicSpy = jasmine.createSpyObj('FightLogicService', ['flee', 'attack'], {
            fight: new BehaviorSubject<IFight>({
                player1: { id: '1', name: 'Player1', currentLife: 80, life: 100 },
                player2: { id: '2', name: 'Player2', currentLife: 50, life: 100 },
                currentPlayer: { name: 'Player1' },
            } as IFight),
        });
        const playerSpy = jasmine.createSpyObj('PlayerService', ['getPlayer']);
        // Ensuite, définissez la valeur de retour par défaut :
        playerSpy.getPlayer.and.returnValue({ id: '1', name: 'Player1' });
        const socketSpy = jasmine.createSpyObj('SocketService', ['onFightTimerUpdate'], { onFightTimerUpdate: () => of(30) });

        await TestBed.configureTestingModule({
            imports: [GameFightInterfaceComponent],
            providers: [
                { provide: FightLogicService, useValue: fightLogicSpy },
                { provide: PlayerService, useValue: playerSpy },
                { provide: SocketReceiverService, useValue: socketSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameFightInterfaceComponent);
        component = fixture.componentInstance;
        fightLogicService = TestBed.inject(FightLogicService) as jasmine.SpyObj<FightLogicService>;
        playerService = TestBed.inject(PlayerService) as jasmine.SpyObj<PlayerService>;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set fight data correctly on init when player is player1', () => {
        expect(component.myPlayer?.name).toBe('Player1');
        expect(component.opponentPlayer?.name).toBe('Player2');
        expect(component.currentNameTurn).toBe('Player1');
        expect(component.lifePercentMyPlayer).toBe(80);
        expect(component.lifePercentOpponent).toBe(50);
    });

    it('should set fight data correctly on init when player is player2', () => {
        // Définir la valeur de retour avant d'émettre le combat
        playerService.getPlayer.and.returnValue({ id: '2', name: 'Player2' } as IPlayer);
        fightLogicService.fight.next({
            player1: { id: '1', name: 'Player1', currentLife: 80, life: 100 },
            player2: { id: '2', name: 'Player2', currentLife: 50, life: 100 },
            currentPlayer: { name: 'Player2' },
        } as IFight);
        fixture.detectChanges();

        expect(component.myPlayer?.name).toBe('Player2');
        expect(component.opponentPlayer?.name).toBe('Player1');
        expect(component.currentNameTurn).toBe('Player2');
        expect(component.lifePercentMyPlayer).toBe(50);
        expect(component.lifePercentOpponent).toBe(80);
    });

    it('should update timer on socket event', () => {
        expect(component.timer).toBe('30 s');
    });

    it('should determine if it is my turn correctly', () => {
        expect(component.isMyTurn()).toBeTrue();
    });

    it('should call flee when flee method is executed', () => {
        component.flee();
        expect(fightLogicService.flee).toHaveBeenCalled();
    });

    it('should call attack when attack method is executed', () => {
        component.attack();
        expect(fightLogicService.attack).toHaveBeenCalled();
    });

    it('should compute default life percentages when life properties are undefined', () => {
        // On simule le cas d'un joueur dont currentLife et life sont undefined.
        playerService.getPlayer.and.returnValue({ id: '1', name: 'Player1' } as IPlayer);
        fightLogicService.fight.next({
            player1: { id: '1', name: 'Player1', avatar: 'defaultAvatar', currentLife: undefined, life: 4 } as unknown as IPlayer,
            player2: { id: '2', name: 'Player2', avatar: 'defaultAvatar', currentLife: undefined, life: 4 } as unknown as IPlayer,
            currentPlayer: { name: 'Player2' },
        } as IFight);
        fixture.detectChanges();

        // Pour myPlayer, comme currentLife vaut undefined -> default à 0,
        // et life vaut undefined -> default à 1, on obtient (0/1)*100 = 0.
        expect(component.lifePercentMyPlayer).toBe(0);
        // De même pour opponent.
        expect(component.lifePercentOpponent).toBe(0);
    });
});
