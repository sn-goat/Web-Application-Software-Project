import { Item } from '@common/enums';
import { Entry, GameMessage, ITEM_TO_NAME } from '@common/journal';
import { Player } from '@app/class/player';

export class JournalManager {
    private static readonly endGameMessage: string = 'Les joueurs actifs sont :\n';
    private static readonly damageMessage: string = 'points de dégats à';
    static processEntry(messageType: GameMessage, playersInvolved: Player[], item?: Item): Entry {
        let messageFormat: string;
        let messagePlayer: string;
        let isFight = false;
        const playersName = playersInvolved.map((player) => player.name);
        const playersId = playersInvolved.map((player) => player.id);

        switch (messageType) {
            case GameMessage.PickItem:
                messageFormat = this.processItemMessage(item, playersInvolved);
                break;
            case GameMessage.AttackDiceResult:
            case GameMessage.DefenseDiceResult:
                messageFormat = this.processDiceMessage(messageType, playersInvolved);
                isFight = true;
                break;
            case GameMessage.DamageResult:
                messageFormat = this.processDamageMessage(playersInvolved);
                isFight = true;
                break;
            case GameMessage.FleeAttempt:
            case GameMessage.FleeSuccess:
            case GameMessage.FleeFailure:
                messageFormat = `${messageType} ${playersInvolved[0].name}`;
                isFight = true;
                break;
            case GameMessage.EndGame:
                messagePlayer = playersName.join(',\n');
                messageFormat = `${messageType} ${playersInvolved[0].name}\n ${this.endGameMessage} ${messagePlayer}`;
                break;
            default: {
                messagePlayer = playersInvolved.length > 1 ? playersName.join(' et ') : playersName[0];
                messageFormat = `${messageType} ${messagePlayer}`;
                const isFightMessage = messageType === GameMessage.AttackInit;

                if (isFightMessage) {
                    isFight = true;
                }
                break;
            }
        }

        const newMessage: Entry = {
            isFight,
            message: messageFormat,
            playersInvolved: playersId,
        };

        return newMessage;
    }

    private static processItemMessage(item: Item, playersInvolved: Player[]): string {
        const itemName = ITEM_TO_NAME[item];
        if (!itemName) {
            throw new Error(`Item ${item} does not exist`);
        }
        return `${GameMessage.PickItem} ${itemName} par ${playersInvolved[0].name}`;
    }

    private static processDiceMessage(messageType: GameMessage, playersInvolved: Player[]): string {
        return `${messageType} ${playersInvolved[0].name} : ${playersInvolved[0].diceResult}`;
    }

    private static processDamageMessage(playersInvolved: Player[]): string {
        return `${playersInvolved[0].name} ${GameMessage.DamageResult} ${playersInvolved[0].getDamage()} ${this.damageMessage} ${
            playersInvolved[1].name
        }`;
    }
}
