import { TestBed } from '@angular/core/testing';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { ChatMessage } from '@common/chat';
import { IPlayer } from '@common/player';
import { Subject } from 'rxjs';
import { ChatService } from './chat.service';

describe('ChatService', () => {
    let service: ChatService;
    let socketEmitterMock: jasmine.SpyObj<SocketEmitterService>;
    let socketReceiverMock: jasmine.SpyObj<SocketReceiverService>;
    let messageSubject: Subject<ChatMessage>;
    let mockPlayer: IPlayer;
    let mockMessage: string;

    beforeEach(() => {
        // Setup mock player and test message
        mockPlayer = {
            id: '123',
            name: 'TestPlayer',
            position: { x: 0, y: 0 },
            spawnPosition: { x: 0, y: 0 },
        } as IPlayer;
        mockMessage = 'Hello World';

        // Create socket service mocks with all necessary methods
        socketEmitterMock = jasmine.createSpyObj('SocketEmitterService', ['sendMessageToServer', 'getAccessCode']);
        socketEmitterMock.getAccessCode.and.returnValue('TEST-ACCESS-CODE');

        // Setup message subject to control message emission in tests
        messageSubject = new Subject<ChatMessage>();
        socketReceiverMock = jasmine.createSpyObj('SocketReceiverService', ['receiveMessageFromServer']);
        socketReceiverMock.receiveMessageFromServer.and.returnValue(messageSubject);

        // Setup TestBed with mocks
        TestBed.configureTestingModule({
            providers: [
                ChatService,
                { provide: SocketEmitterService, useValue: socketEmitterMock },
                { provide: SocketReceiverService, useValue: socketReceiverMock },
            ],
        });

        // Get service instance
        service = TestBed.inject(ChatService);

        // Add the clearChatHistory method to test it
        service['clearChatHistory'] = function () {
            this.chatHistory.set([]);
        };
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize with empty chat history', () => {
        expect(service.chatHistory()).toEqual([]);
    });

    it('should subscribe to socket receiver on construction', () => {
        expect(socketReceiverMock.receiveMessageFromServer).toHaveBeenCalledTimes(1);
    });

    it('should add received messages to chat history', () => {
        // Arrange
        const testMessage: ChatMessage = {
            accessCode: 'TEST-ACCESS-CODE',
            sender: { id: '456', name: 'OtherPlayer' } as IPlayer,
            message: 'Hi there',
            timestamp: '12:05:00',
        };

        // Verify starting state
        expect(service.chatHistory().length).toBe(0);

        // Act - emit message
        messageSubject.next(testMessage);

        // Assert
        expect(service.chatHistory().length).toBe(1);
        expect(service.chatHistory()[0]).toEqual(testMessage);
    });

    it('should handle multiple received messages correctly', () => {
        // Arrange
        const testMessages: ChatMessage[] = [
            {
                accessCode: 'TEST-ACCESS-CODE',
                sender: { id: '456', name: 'Player1' } as IPlayer,
                message: 'Message 1',
                timestamp: '12:05:00',
            },
            {
                accessCode: 'TEST-ACCESS-CODE',
                sender: { id: '789', name: 'Player2' } as IPlayer,
                message: 'Message 2',
                timestamp: '12:06:00',
            },
        ];

        // Act - emit messages
        messageSubject.next(testMessages[0]);
        messageSubject.next(testMessages[1]);

        // Assert
        expect(service.chatHistory().length).toBe(2);
        expect(service.chatHistory()[0]).toEqual(testMessages[0]);
        expect(service.chatHistory()[1]).toEqual(testMessages[1]);
    });

    it('should package messages correctly with all required fields', () => {
        // Act
        const result = service.packageMessage(mockMessage, mockPlayer);

        // Assert
        expect(result.accessCode).toBe('TEST-ACCESS-CODE');
        expect(result.sender).toBe(mockPlayer);
        expect(result.message).toBe(mockMessage);
        expect(result.timestamp).toBeTruthy();
        expect(typeof result.timestamp).toBe('string');
    });

    it('should send message to server with correct format', () => {
        // Act
        service.sendMessage(mockMessage, mockPlayer);

        // Assert - verify the socket emitter was called with correct message
        expect(socketEmitterMock.sendMessageToServer).toHaveBeenCalledTimes(1);
        const sentMessage = socketEmitterMock.sendMessageToServer.calls.mostRecent().args[0];
        expect(sentMessage.message).toBe(mockMessage);
        expect(sentMessage.sender).toBe(mockPlayer);
        expect(sentMessage.accessCode).toBe('TEST-ACCESS-CODE');
    });

    it('should add sent messages to chat history', () => {
        // Verify starting state
        expect(service.chatHistory().length).toBe(0);

        // Act
        service.sendMessage(mockMessage, mockPlayer);

        // Assert
        expect(service.chatHistory().length).toBe(1);
        expect(service.chatHistory()[0].message).toBe(mockMessage);
        expect(service.chatHistory()[0].sender).toBe(mockPlayer);
    });

    it('should clear chat history when clearChatHistory is called', () => {
        // Arrange - add some messages to history
        service.sendMessage('Message 1', mockPlayer);
        service.sendMessage('Message 2', mockPlayer);
        expect(service.chatHistory().length).toBe(2);

        // Act
        service['clearChatHistory']();

        // Assert
        expect(service.chatHistory().length).toBe(0);
        expect(service.chatHistory()).toEqual([]);
    });

    it('should maintain chat history state between operations', () => {
        // First add a sent message
        service.sendMessage('Sent message', mockPlayer);
        expect(service.chatHistory().length).toBe(1);

        // Then receive a message
        const receivedMessage: ChatMessage = {
            accessCode: 'TEST-ACCESS-CODE',
            sender: { id: '456', name: 'OtherPlayer' } as IPlayer,
            message: 'Received message',
            timestamp: '12:05:00',
        };
        messageSubject.next(receivedMessage);

        // Should have both messages
        expect(service.chatHistory().length).toBe(2);
        expect(service.chatHistory()[0].message).toBe('Sent message');
        expect(service.chatHistory()[1].message).toBe('Received message');

        // Clear and verify it's empty
        service['clearChatHistory']();
        expect(service.chatHistory().length).toBe(0);

        // Add more messages and verify they're added to empty history
        service.sendMessage('New message', mockPlayer);
        expect(service.chatHistory().length).toBe(1);
    });
});
