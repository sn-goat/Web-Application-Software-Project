export enum GameMessage {
    START_TURN = 'Début du tour à  ',
    START_FIGHT = 'Début du combat entre ',
    END_FIGHT = 'Fin du combat entre',
    WINNER_FIGHT = 'Le gagnant du combat est',
    LOSER_FIGHT = 'Le perdant du combat est',
    PICK_ITEM = "Ramassage d'un item par ",
    PICK_FLAG = 'Ramassage du drapeau par ',
    OPEN_DOOR = 'Ouverture de la porte par ',
    CLOSE_DOOR = 'Fermeture de la porte par ',
    QUIT = 'Abandon de la partie par ',
    END_GAME = 'Fin de la partie. Le gagnant est ',
    ACTIVATE_DEBUG_MODE = 'Activation du mode debug par ',
    DEACTIVATE_DEBUG_MODE = 'Désactivation du mode debug par ',
}

export enum FightMessage {
    ATTACK = 'Attaque de ',
    DEFENSE = 'Défense de ',
    FLEE_ATTEMPT = 'Tentative de fuite de ',
    FLEE_SUCCESS = 'Fuite réussie de ',
    FLEE_FAILURE = 'Fuite échouée de ',
    DAMAGE = 'Dégâts infligés à ',
    VICTORY = 'Victoire de ',
    DEFEAT = 'Défaite de ',
}

export interface Entry {
    messageType: GameMessage | FightMessage;
    message: string;
    accessCode: string;
}
