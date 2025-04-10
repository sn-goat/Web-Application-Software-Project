/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-empty-function */

import { Vec2 } from '@common/board';
import { ChatMessage } from '@common/chat';
import { Item, Tile } from '@common/enums';
import { IFight, IGame, IRoom, PathInfo, TurnInfo } from '@common/game';
import { Entry } from '@common/journal';
import { IPlayer, PlayerInput } from '@common/player';
import { Subject } from 'rxjs';

export class MockSocketService {
    gameRoom: IRoom = {
        accessCode: 'test-code',
        organizerId: 'organizer-id',
        isLocked: false,
        game: { players: [], map: [], currentTurn: 0, isCTF: false, isDebugMode: false, maxPlayers: 4 },
    };

    private playerJoinedSubject = new Subject<IRoom>();
    private playerMovedSubject = new Subject<{ previousPosition: Vec2; player: IPlayer }>();
    private playerRemovedSubject = new Subject<unknown>();
    private playerUpdatedSubject = new Subject<IPlayer[]>();
    private setCharacterSubject = new Subject<IPlayer>();
    private roomLockedSubject = new Subject<unknown>();
    private roomUnlockedSubject = new Subject<void>();
    private gameSubject = new Subject<IGame>();
    private roomCreatedSubject = new Subject<unknown>();
    private joinErrorSubject = new Subject<string>();
    private debugStateSubject = new Subject<unknown>();
    private startTurnSubject = new Subject<unknown>();
    private onPlayerTurnChangedSubject = new Subject<TurnInfo>();
    private doorSubject = new Subject<unknown>();
    private endOfGame = new Subject<unknown>();
    private gameStartedError = new Subject<string>();
    private itemCollected = new Subject<Item>();
    private itemDropped = new Subject<Item>();
    private mapUpdate = new Subject<unknown>();
    private inventoryFull = new Subject<unknown>();

    private journalSubject = new Subject<Entry[]>();
    private chatSubject = new Subject<ChatMessage>();

    private turnUpdateSubject = new Subject<TurnInfo>();
    private fightInitSubject = new Subject<IFight>();
    private fighterTurnChangedSubject = new Subject<IFight>();
    private endFightSubject = new Subject<unknown>();

    getCurrentPlayerId(): string {
        return 'current-player';
    }

    onPlayerJoined() {
        return this.playerJoinedSubject.asObservable();
    }

    onPlayerMoved() {
        return this.playerMovedSubject.asObservable();
    }

    onJournalEntry() {
        return this.journalSubject.asObservable();
    }

    receiveMessageFromServer() {
        return this.chatSubject.asObservable();
    }

    onPlayerRemoved() {
        return this.playerRemovedSubject.asObservable();
    }

    onPlayersUpdated() {
        return this.playerUpdatedSubject.asObservable();
    }

    onSetCharacter() {
        return this.setCharacterSubject.asObservable();
    }

    onRoomLocked() {
        return this.roomLockedSubject.asObservable();
    }

    onRoomUnlocked() {
        return this.roomUnlockedSubject.asObservable();
    }

    onGameStarted() {
        return this.gameSubject.asObservable();
    }

    onRoomCreated() {
        return this.roomCreatedSubject.asObservable();
    }

    onJoinError() {
        return this.joinErrorSubject.asObservable();
    }

    onTurnStart() {
        return this.startTurnSubject.asObservable();
    }

    onPlayerTurnChanged() {
        return this.onPlayerTurnChangedSubject.asObservable();
    }

    onDoorStateChanged() {
        return this.doorSubject.asObservable();
    }

    onFightInit() {
        return this.fightInitSubject.asObservable();
    }

    onEndFight() {
        return this.endFightSubject.asObservable();
    }

    onFighterTurnChanged() {
        return this.fighterTurnChangedSubject.asObservable();
    }

    onPlayerTurnUpdate() {
        return this.turnUpdateSubject.asObservable();
    }

    onGameEnded() {
        return this.endOfGame.asObservable();
    }

    onDebugModeChanged() {
        return this.debugStateSubject.asObservable();
    }

    onGameStartedError() {
        return this.gameStartedError.asObservable();
    }

    onItemCollected() {
        return this.itemCollected.asObservable();
    }

    onItemDropped() {
        return this.itemDropped.asObservable();
    }

    onInventoryFull() {
        return this.inventoryFull.asObservable();
    }

    onMapUpdate() {
        return this.mapUpdate.asObservable();
    }

    createRoom(_mapName: string): void {}
    lockRoom(_accessCode: string): void {}
    unlockRoom(_accessCode: string): void {}
    expelPlayer(_playerId: string): void {}
    disconnect(_playerId: string): void {}
    createGame(_accessCode: string, _mapName: string): void {}
    startGame(): void {}
    movePlayer(_selectedPath: PathInfo, _playerId: string): void {}
    changeDoorState(_position: Vec2, _playerId: string): void {}
    joinRoom(_accessCode: string): void {}
    shareCharacter(_player: PlayerInput): void {}
    flee(): void {}
    attack(): void {}
    ready(_playerId: string): void {}

    endTurn(_accessCode: string): void {}

    initFight(_player: string, _defender: string): void {}
    debugMove(_position: Vec2, _playerId: string): void {}
    toggleDebug(): void {}
    inventoryChoice(payload: { playerId: string; itemToThrow: Item; itemToAdd: Item; position: Vec2; accessCode: string }): void {}

    triggerPlayerJoined(data: IRoom) {
        this.playerJoinedSubject.next(data);
    }

    triggerOnPlayersUpdated(data: IPlayer[]) {
        this.playerUpdatedSubject.next(data);
    }

    triggerPlayerMoved(movement: { previousPosition: Vec2; player: IPlayer }) {
        this.playerMovedSubject.next(movement);
    }

    triggerPlayerRemoved() {
        this.playerRemovedSubject.next(null);
    }

    triggerRoomLocked() {
        this.roomLockedSubject.next(null);
    }

    triggerOnRoomUnlocked() {
        this.roomUnlockedSubject.next();
    }

    triggerRoomCreated(data: IRoom) {
        this.roomCreatedSubject.next(data);
    }

    triggerJoinError(message: string) {
        this.joinErrorSubject.next(message);
    }

    triggerStartTurn() {
        this.startTurnSubject.next(null);
    }

    triggerDoorStateChanged(data: { doorPosition: Vec2; newDoorState: Tile.CLOSED_DOOR | Tile.OPENED_DOOR }) {
        this.doorSubject.next(data);
    }

    triggerOnFightInit(data: IFight) {
        this.fightInitSubject.next(data);
    }

    triggerOnFightTurnChanged(data: IFight) {
        this.fighterTurnChangedSubject.next(data);
    }

    triggerSetCharacter(data: IPlayer) {
        this.setCharacterSubject.next(data);
    }

    triggerEndFight(data: unknown) {
        this.endFightSubject.next(data);
    }

    triggerTurnUpdate(data: TurnInfo) {
        this.turnUpdateSubject.next(data);
    }

    triggerOnGameStarted(data: IGame) {
        this.gameSubject.next(data);
    }

    triggerPlayerTurnChanged(data: TurnInfo) {
        this.onPlayerTurnChangedSubject.next(data);
    }

    triggerOnDebugModeChanged(data: boolean) {
        this.debugStateSubject.next(data);
    }

    triggerOnGameStartedError(data: string) {
        this.gameStartedError.next(data);
    }

    triggerEndOfGame() {
        this.endOfGame.next(null);
    }

    triggerItemCollected(data: Item) {
        this.itemCollected.next(data);
    }

    triggerItemDropped(data: Item) {
        this.itemDropped.next(data);
    }

    triggerMapUpdate(data: unknown) {
        this.mapUpdate.next(data);
    }

    triggerInventoryFull(data: unknown) {
        this.inventoryFull.next(data);
    }

    getAccessCode() {
        return this.gameRoom.accessCode;
    }
}
