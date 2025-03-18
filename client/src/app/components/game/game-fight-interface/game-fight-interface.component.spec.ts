import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FightLogicService } from '@app/services/fight-logic/fight-logic.service';
import { PlayerService } from '@app/services/player/player.service';
import { SocketService } from '@app/services/socket/socket.service';
import { FightInfo } from '@common/game';
import { PlayerStats } from '@common/player';
import { BehaviorSubject } from 'rxjs';
import { GameFightInterfaceComponent } from './game-fight-interface.component';

describe('GameFightInterfaceComponent', () => {
  let component: GameFightInterfaceComponent;
  let fixture: ComponentFixture<GameFightInterfaceComponent>;
  let fightSubject: BehaviorSubject<any>;
  let fightLogicSpy: jasmine.SpyObj<FightLogicService>;
  let playerServiceSpy: jasmine.SpyObj<PlayerService>;
  let socketServiceSpy: jasmine.SpyObj<SocketService>;

  beforeEach(async () => {
    fightSubject = new BehaviorSubject<any>(null);
    fightLogicSpy = jasmine.createSpyObj('FightLogicService', [], { fight: fightSubject.asObservable() });
    playerServiceSpy = jasmine.createSpyObj('PlayerService', ['getPlayer']);
    socketServiceSpy = jasmine.createSpyObj('SocketService', ['onFightTimerUpdate'], {
      onFightTimerUpdate: () => new BehaviorSubject<number>(0).asObservable(),
    });

    await TestBed.configureTestingModule({
      imports: [GameFightInterfaceComponent],
      providers: [
        { provide: FightLogicService, useValue: fightLogicSpy },
        { provide: PlayerService, useValue: playerServiceSpy },
        { provide: SocketService, useValue: socketServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GameFightInterfaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait mettre à jour myPlayer et opponentPlayer quand fight est émis', () => {
    playerServiceSpy.getPlayer.and.returnValue({ id: 'player1' } as PlayerStats);

    fightSubject.next({
      player1: { id: 'player1', currentLife: 50, life: 100 } as PlayerStats & FightInfo,
      player2: { id: 'player2', currentLife: 40, life: 80 } as PlayerStats & FightInfo,
      currentPlayer: { name: 'Player1' },
    });
    fixture.detectChanges();

    expect(component.myPlayer?.id).toBe('player1');
    expect(component.opponentPlayer?.id).toBe('player2');
    expect(component.currentNameTurn).toBe('Player1');
    expect(component.lifePercentMyPlayer).toBe(50);
    expect(component.lifePercentOpponent).toBe(50);
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait retourner vrai quand c’est mon tour', () => {
    playerServiceSpy.getPlayer.and.returnValue({ name: 'Player1' } as PlayerStats);
    component.currentNameTurn = 'Player1';
    expect(component.isMyTurn()).toBeTrue();
  });
});