import { Vec2 } from '@common/board';
import { Dice, IPlayer } from '@common/player';

const dice4 = 4;
const dice6 = 6;
const minDiceValue = 1;

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

    constructor(id: string, player: IPlayer) {
        this.id = id;
        this.name = player.name;
        this.avatar = player.avatar;
        this.life = player.life;
        this.speed = player.speed;
        this.attackPower = player.attackPower;
        this.defensePower = player.defensePower;
        this.attackDice = player.attackDice;
        this.defenseDice = player.defenseDice;
        this.actions = player.actions;
        this.wins = player.wins;
        this.movementPts = player.movementPts;
        this.position = player.position;
        this.spawnPosition = player.spawnPosition;
    }

    attack(isDebugMode: boolean): number {
        if (isDebugMode) {
            return this.diceToNumber(this.attackDice);
        }
        return Math.floor(Math.random() * this.diceToNumber(this.attackDice)) + 1;
    }

    defend(isDebugMode: boolean): number {
        if (isDebugMode) {
            return minDiceValue;
        }
        return Math.floor(Math.random() * this.diceToNumber(this.defenseDice)) + 1;
    }

    initTurn(): void {
        this.movementPts = this.speed;
        this.actions = 1;
    }

    private diceToNumber(dice: Dice): number {
        return dice === 'D6' ? dice6 : dice4;
    }
}
