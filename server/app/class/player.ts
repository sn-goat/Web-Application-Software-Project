import { Vec2 } from '@common/board';
import { Tile } from '@common/enums';
import {
    ATTACK_ICE_DECREMENT,
    DEFAULT_ACTIONS,
    DEFAULT_FLEE_ATTEMPTS,
    DEFAULT_WINS,
    DEFENSE_ICE_DECREMENT,
    Dice,
    IPlayer,
    PlayerInput,
} from '@common/player';

const dice4 = 4;
const dice6 = 6;
const minDiceValue = 1;
const fleeThreshold = 0.3;

export class Player implements IPlayer {
    id: string;
    name: string;
    avatar: string;
    life: number;
    speed: number;
    attackPower: number;
    defensePower: number;
    attackDice: Dice;
    defenseDice: Dice;
    actions: number;
    wins: number;
    movementPts: number;
    position: Vec2;
    spawnPosition: Vec2;
    fleeAttempts: number;
    currentLife: number;
    diceResult: number;

    constructor(id: string, player: PlayerInput) {
        this.id = id;
        this.name = player.name;
        this.avatar = player.avatar;
        this.life = player.life;
        this.speed = player.speed;
        this.attackDice = player.attackDice;
        this.defenseDice = player.defenseDice;
        this.attackPower = player.attackPower;
        this.defensePower = player.defensePower;

        this.wins = DEFAULT_WINS;
    }

    attemptFlee(): boolean {
        this.fleeAttempts -= 1;
        const isFleeSuccessful = Math.random() < fleeThreshold;
        return isFleeSuccessful;
    }

    initTurn(): void {
        this.movementPts = this.speed;
        this.actions = DEFAULT_ACTIONS;
    }

    initFight(): void {
        this.fleeAttempts = DEFAULT_FLEE_ATTEMPTS;
        this.currentLife = this.life;
        this.diceResult = 0;
    }

    attack(isDebugMode: boolean, playerDefender: Player): boolean {
        const damage = Math.max(this.initiateAttack(isDebugMode) - playerDefender.initiateDefence(isDebugMode), 0);
        playerDefender.currentLife = Math.max(playerDefender.currentLife - damage, 0);
        return playerDefender.currentLife === 0;
    }

    updatePosition(position: Vec2, fieldType: Tile): void {
        this.attackPower = fieldType === Tile.ICE ? this.attackPower - ATTACK_ICE_DECREMENT : this.attackPower;
        this.defensePower = fieldType === Tile.ICE ? this.defensePower - DEFENSE_ICE_DECREMENT : this.defensePower;
        this.position = position;
    }

    private initiateAttack(isDebugMode: boolean): number {
        this.diceResult = isDebugMode ? this.diceToNumber(this.attackDice) : Math.floor(Math.random() * this.diceToNumber(this.attackDice)) + 1;
        return this.diceResult + this.attackPower;
    }

    private initiateDefence(isDebugMode: boolean): number {
        this.diceResult = isDebugMode ? minDiceValue : Math.floor(Math.random() * this.diceToNumber(this.defenseDice)) + 1;
        return this.diceResult + this.defensePower;
    }

    private diceToNumber(dice: Dice): number {
        return dice === 'D6' ? dice6 : dice4;
    }
}
