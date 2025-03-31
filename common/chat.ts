import { IPlayer } from './player';

export interface ChatMessage {
    accessCode: string;
    sender: IPlayer;
    message: string;
    timestamp: string;
}
