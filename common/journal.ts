import { IPlayer } from '@common/player';

export enum GameMessage {
    StartTurn = 'Début du tour à  ',
    StartFight = 'Début du combat entre ',
    EndFight = 'Fin du combat entre',
    WinnerFight = 'Le gagnant du combat est',
    LoserFight = 'Le perdant du combat est',
    PickItem = "Ramassage d'un item par ",
    PickFlag = 'Ramassage du drapeau par ',
    OpenDoor = 'Ouverture de la porte par ',
    CloseDoor = 'Fermeture de la porte par ',
    Quit = 'Abandon de la partie par ',
    EndGame = 'Fin de la partie. Le gagnant est ',
    ActivateDebugMode = 'Activation du mode debug par ',
    DeactivateDebugMode = 'Désactivation du mode debug par ',
}

export enum FightMessage {
    Attack = 'Attaque de ',
    FleeAttempt = 'Tentative de fuite de ',
    FleeSuccess = 'Fuite réussie de ',
    FleeFailure = 'Fuite échouée de ',
}

export interface Entry {
    messageType: GameMessage | FightMessage;
    message: string;
    accessCode: string;
    playersInvolved: string[];
}

export interface FightJournal {
    attacker: IPlayer;
    defender: IPlayer;
    accessCode: string;
    damage?: number;
    fleeSuccess?: boolean;
}
