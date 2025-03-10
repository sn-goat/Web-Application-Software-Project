/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-empty-function */

import { Vec2 } from '@common/board';
import { Game, Room } from '@common/game';
import { PlayerStats } from '@common/player';
import { Subject } from 'rxjs';

export class MockSocketService {
    gameRoom: Room = {
        accessCode: 'test-code',
        organizerId: 'organizer-id',
        players: [],
        isLocked: false,
        mapSize: 15,
    };
    private playerJoinedSubject = new Subject<unknown>();
    private playersListSubject = new Subject<PlayerStats[]>();
    private playerRemovedSubject = new Subject<PlayerStats[]>();
    private playerDisconnectedSubject = new Subject<PlayerStats[]>();
    private roomLockedSubject = new Subject<unknown>();
    private gameSubject = new Subject<Game>();
    private roomCreatedSubject = new Subject<unknown>();
    private joinErrorSubject = new Subject<{ message: string }>();
    private broadcastDebugStateSubject = new Subject<unknown>();
    private startTurnSubject = new Subject<unknown>();
    private endTurnSubject = new Subject<unknown>();
    private fullInventorySubject = new Subject<unknown>();
    private broadcastMoveSubject = new Subject<unknown>();
    private broadcastItemSubject = new Subject<unknown>();
    private broadcastDoorSubject = new Subject<unknown>();
    private switchTurnSubject = new Subject<unknown>();
    private endFightSubject = new Subject<unknown>();

    getGameSize() {
        return 15; // Retourne une taille numérique appropriée
    }

    getCurrentPlayerId(): string {
        return 'current-player';
    }

    onPlayerJoined() {
        return this.playerJoinedSubject.asObservable();
    }

    onPlayersList() {
        return this.playersListSubject.asObservable();
    }

    onPlayerRemoved() {
        return this.playerRemovedSubject.asObservable();
    }

    onPlayerDisconnected() {
        return this.playerDisconnectedSubject.asObservable();
    }

    onRoomLocked() {
        return this.roomLockedSubject.asObservable();
    }

    onBroadcastStartGame() {
        return this.gameSubject.asObservable();
    }

    // Méthodes manquantes des observables
    onRoomCreated() {
        return this.roomCreatedSubject.asObservable();
    }

    onJoinError() {
        return this.joinErrorSubject.asObservable();
    }

    onBroadcastDebugState() {
        return this.broadcastDebugStateSubject.asObservable();
    }

    onStartTurn() {
        return this.startTurnSubject.asObservable();
    }

    onEndTurn() {
        return this.endTurnSubject.asObservable();
    }

    onFullInventory() {
        return this.fullInventorySubject.asObservable();
    }

    onBroadcastMove() {
        return this.broadcastMoveSubject.asObservable();
    }

    onBroadcastItem() {
        return this.broadcastItemSubject.asObservable();
    }

    onBroadcastDoor() {
        return this.broadcastDoorSubject.asObservable();
    }

    onSwitchTurn() {
        return this.switchTurnSubject.asObservable();
    }

    onEndFight() {
        return this.endFightSubject.asObservable();
    }

    createRoom(_size: number): void {}
    lockRoom(_accessCode: string): void {}
    unlockRoom(_accessCode: string): void {}
    removePlayer(_accessCode: string, _playerId: string): void {}
    disconnect(_accessCode: string, _playerId: string): void {}
    createGame(_accessCode: string, _mapName: string): void {}
    configureGame(_accessCode: string, _players: PlayerStats[]): void {}
    movePlayer(_accessCode: string, _playerId: string, _direction: Vec2): void {}
    changeDoorState(_accessCode: string, _position: Vec2): void {}
    joinRoom(_accessCode: string): void {}
    shareCharacter(_accessCode: string, _player: PlayerStats): void {}
    initFight(_accessCode: string, _playerId: string, _enemyPosition: Vec2): void {}
    playerFlee(_accessCode: string, _playerId: string): void {}
    playerAttack(_accessCode: string, _playerId: string): void {}

    triggerPlayerJoined(data: { room: { players: unknown[] } }) {
        this.playerJoinedSubject.next(data);
    }

    triggerPlayersList(players: PlayerStats[]) {
        this.playersListSubject.next(players);
    }

    triggerPlayerRemoved(players: PlayerStats[]) {
        this.playerRemovedSubject.next(players);
    }

    triggerPlayerDisconnected(players: PlayerStats[]) {
        this.playerDisconnectedSubject.next(players);
    }

    triggerRoomLocked(data: unknown) {
        this.roomLockedSubject.next(data);
    }

    triggerOnBroadcastStartGame(game: Game) {
        this.gameSubject.next(game);
    }

    // Méthodes pour déclencher les événements dans les tests
    triggerRoomCreated(data: unknown) {
        this.roomCreatedSubject.next(data);
    }

    triggerJoinError(errorData: { message: string }) {
        this.joinErrorSubject.next(errorData);
    }

    triggerBroadcastDebugState(data: unknown) {
        this.broadcastDebugStateSubject.next(data);
    }

    triggerStartTurn(data: unknown) {
        this.startTurnSubject.next(data);
    }

    triggerEndTurn(data: unknown) {
        this.endTurnSubject.next(data);
    }

    triggerFullInventory(data: unknown) {
        this.fullInventorySubject.next(data);
    }

    triggerBroadcastMove(data: unknown) {
        this.broadcastMoveSubject.next(data);
    }

    triggerBroadcastItem(data: unknown) {
        this.broadcastItemSubject.next(data);
    }

    triggerBroadcastDoor(data: unknown) {
        this.broadcastDoorSubject.next(data);
    }

    triggerSwitchTurn(data: unknown) {
        this.switchTurnSubject.next(data);
    }

    triggerEndFight(data: unknown) {
        this.endFightSubject.next(data);
    }
}
