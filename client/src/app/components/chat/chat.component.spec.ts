/* eslint-disable @typescript-eslint/no-explicit-any */
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ChatService } from '@app/services/chat/chat.service';
import { PlayerService } from '@app/services/player/player.service';
import { ChatMessage } from '@common/chat';
import { IPlayer } from '@common/player';
import { BehaviorSubject } from 'rxjs';
import { ChatComponent } from './chat.component';

describe('ChatComponent', () => {
    let component: ChatComponent;
    let fixture: ComponentFixture<ChatComponent>;
    let chatServiceMock: jasmine.SpyObj<ChatService>;
    let playerServiceMock: jasmine.SpyObj<PlayerService>;
    let mockPlayer: IPlayer;
    let mockChatHistory: ChatMessage[];

    beforeEach(async () => {
        mockPlayer = { id: '123', name: 'TestPlayer', position: { x: 0, y: 0 }, spawnPosition: { x: 0, y: 0 } } as IPlayer;
        mockChatHistory = [];

        // Create spies for the services
        chatServiceMock = jasmine.createSpyObj('ChatService', ['sendMessage', 'clearChatHistory'], {
            chatHistory: signal(mockChatHistory),
        });

        playerServiceMock = jasmine.createSpyObj('PlayerService', [], {
            myPlayer: new BehaviorSubject(mockPlayer),
        });

        await TestBed.configureTestingModule({
            imports: [FormsModule, ChatComponent],
            providers: [
                { provide: ChatService, useValue: chatServiceMock },
                { provide: PlayerService, useValue: playerServiceMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set myPlayer from PlayerService in ngOnInit', () => {
        // This is already tested during component initialization
        expect(component.myPlayer).toEqual(mockPlayer);
    });

    it('should call sendMessage with trimmed message when valid', () => {
        // Arrange
        component.newMessage = 'Hello World  ';

        // Act
        component.sendMessage();

        // Assert
        expect(chatServiceMock.sendMessage).toHaveBeenCalledWith('Hello World', mockPlayer);
        expect(component.newMessage).toBe('');
    });

    it('should not send empty or whitespace-only messages', () => {
        // Empty message
        component.newMessage = '';
        component.sendMessage();
        expect(chatServiceMock.sendMessage).not.toHaveBeenCalled();

        // Whitespace-only message
        component.newMessage = '   ';
        component.sendMessage();
        expect(chatServiceMock.sendMessage).not.toHaveBeenCalled();
    });

    it('should not send message if player is null', () => {
        // Arrange
        component.myPlayer = null;
        component.newMessage = 'Hello World';

        // Act
        component.sendMessage();

        // Assert
        expect(chatServiceMock.sendMessage).not.toHaveBeenCalled();
    });

    describe('view and scroll functionality', () => {
        beforeEach(() => {
            // Mock the ElementRef for scrollAnchor
            component.scrollAnchor = {
                nativeElement: jasmine.createSpyObj('nativeElement', ['scrollIntoView']),
            } as any;

            // Reset the previousMessageCount
            component['previousMessageCount'] = 0;
        });

        it('should call scrollToBottom when new messages arrive', () => {
            // Arrange
            spyOn(component, 'scrollToBottom');
            const newMessages = [
                {
                    accessCode: 'test',
                    sender: mockPlayer,
                    message: 'test message',
                    timestamp: '12:00',
                },
            ];

            // Set the initial state
            component['previousMessageCount'] = 0;

            // Update the signal value directly instead of trying to spy on it
            (chatServiceMock.chatHistory as any).set(newMessages);

            // Act
            component.ngAfterViewChecked();

            // Assert
            expect(component.scrollToBottom).toHaveBeenCalled();
            expect(component['previousMessageCount']).toBe(1);
        });

        it('should not call scrollToBottom when no new messages arrive', () => {
            // Arrange
            spyOn(component, 'scrollToBottom');
            component['previousMessageCount'] = 1;
            const messages = [
                {
                    accessCode: 'test',
                    sender: mockPlayer,
                    message: 'test message',
                    timestamp: '12:00',
                },
            ];

            // Update the signal value
            (chatServiceMock.chatHistory as any).set(messages);

            // Act
            component.ngAfterViewChecked();

            // Assert
            expect(component.scrollToBottom).not.toHaveBeenCalled();
        });

        it('should call scrollIntoView when scrollToBottom is called', () => {
            // Act
            component.scrollToBottom();

            // Assert
            expect(component.scrollAnchor.nativeElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
        });

        it('should not throw error when scrollAnchor is undefined', () => {
            // Arrange
            component.scrollAnchor = undefined as any;

            // Act & Assert - should not throw error
            expect(() => component.scrollToBottom()).not.toThrow();
        });
    });
});
