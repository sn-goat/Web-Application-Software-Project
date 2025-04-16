import { Item } from './enums';

export enum GameMessage {
    StartTurn = 'Début du tour à  ',
    StartFight = 'Début du combat entre ',
    EndFight = 'Fin du combat entre',
    WinnerFight = 'Le gagnant du combat est',
    LoserFight = 'Le perdant du combat est',
    PickItem = "Ramassage de l'item : ",
    OpenDoor = 'Ouverture de la porte par ',
    CloseDoor = 'Fermeture de la porte par ',
    Quit = 'Abandon de la partie par ',
    EndGame = 'Fin de la partie. Le gagnant est ',
    ActivateDebugMode = 'Activation du mode debug par ',
    DeactivateDebugMode = 'Désactivation du mode debug par ',
    AttackInit = 'Attaque initialisé par ',
    AttackDiceResult = 'Résultat du dé d\'attaque de ',
    DefenseDiceResult = 'Résultat du dé de défense de ',
    DamageResult = 'inflige ',
    FleeAttempt = 'Tentative de fuite de ',
    FleeSuccess = 'Fuite réussie de ',
    FleeFailure = 'Fuite échouée de ',
}

export interface Entry {
    isFight: boolean;
    message: string;
    playersInvolved: string[];
}

export const ITEM_TO_NAME: Record<string, string> = {
    [Item.Bow]: 'Arc',
    [Item.Sword]: 'Épée',
    [Item.Shield]: 'Bouclier',
    [Item.LeatherBoot]: 'Bottes en cuir',
    [Item.MonsterEgg]: 'Oeuf de monstre',
    [Item.Pearl]: 'Perle',
    [Item.Flag]: 'Drapeau',
}
