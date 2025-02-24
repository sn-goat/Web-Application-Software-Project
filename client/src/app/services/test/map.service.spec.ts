/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed } from '@angular/core/testing';
import { BOARD_SIZE_MAPPING } from '@app/constants/map-size-limitd';
import { MapService } from '@app/services/code/map.service';
import { Board, Validation } from '@common/board';
import { Item, Size, Tile, Visibility } from '@common/enums';
import { BehaviorSubject } from 'rxjs';

describe('MapService', () => {
    let service: MapService;
    // On utilisera un board "dummy" pour simuler le contenu du localStorage.
    const dummyBoard: Board = {
        _id: 'dummyId',
        name: 'Dummy Board',
        description: 'Dummy description',
        size: 10, // on choisit une taille qui existe dans BOARD_SIZE_MAPPING
        board: [],
        isCTF: false,
        visibility: Visibility.PUBLIC,
        image: 'dummyImage',
        updatedAt: new Date(),
    };

    beforeEach(() => {
        // On simule le localStorage pour le test
        spyOn(localStorage, 'getItem').and.callFake((key: string) => {
            return key === 'firstBoardValue' ? JSON.stringify(dummyBoard) : null;
        });
        spyOn(localStorage, 'setItem');

        TestBed.configureTestingModule({
            providers: [MapService],
        });
        service = TestBed.inject(MapService);
        // On appelle setBoardToFirstValue afin d'initialiser boardToSave et les compteurs.
        service.setBoardToFirstValue();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    /* ==== Tests sur les BehaviorSubject pour les compteurs et le flag ==== */
    it('should increase and decrease spawns to place', () => {
        const initial = service['nbrSpawnsToPlace'].value;
        service.increaseSpawnsToPlace();
        expect(service['nbrSpawnsToPlace'].value).toBe(initial + 1);
        service.decreaseSpawnsToPlace();
        expect(service['nbrSpawnsToPlace'].value).toBe(initial);
    });

    it('should increase and decrease items to place', () => {
        const initial = service['nbrItemsToPlace'].value;
        service.increaseItemsToPlace();
        expect(service['nbrItemsToPlace'].value).toBe(initial + 1);
        service.decreaseItemsToPlace();
        expect(service['nbrItemsToPlace'].value).toBe(initial);
    });

    it('should set hasFlagOnBoard correctly', () => {
        service.setHasFlagOnBoard(true);
        expect(service['hasFlagOnBoard'].value).toBeTrue();
        service.setHasFlagOnBoard(false);
        expect(service['hasFlagOnBoard'].value).toBeFalse();
    });

    /* ==== Test de la méthode isReadyToSave ==== */
    describe('isReadyToSave', () => {
        it('should return an error message when spawns or items remain to be placed', () => {
            // On s'assure que les compteurs sont > 0 en laissant setBoardToFirstValue tel quel.
            // dummyBoard.size vaut 3, donc maxMapObject = BOARD_SIZE_MAPPING[3 as Size] (supposé > 0).
            // De plus, comme le board est généré automatiquement, aucun flag n'est placé.
            // Par ailleurs, isModeCTF est faux (dummyBoard.isCTF === false) par défaut.
            const validation: Validation = service.isReadyToSave();
            expect(validation.isValid).toBeFalse();
            expect(validation.error).toContain('Vous devez placer');
        });

        it('should return valid when no spawns, no items to place and flag is set for CTF', () => {
            // Pour tester la validation positive, on force les compteurs à 0.
            service['nbrSpawnsToPlace'].next(0);
            service['nbrItemsToPlace'].next(0);
            // On teste d'abord pour un mode non-CTF
            let validation: Validation = service.isReadyToSave();
            expect(validation.isValid).toBeTrue();
            expect(validation.error).toBe('');

            // Pour le mode CTF, si le drapeau est placé, la validation est également valide.
            service.getBoardToSave().value.isCTF = true;
            service.setHasFlagOnBoard(true);
            validation = service.isReadyToSave();
            expect(validation.isValid).toBeTrue();
            expect(validation.error).toBe('');
        });

        it('should return error for CTF mode when flag is not placed', () => {
            // On force le mode CTF et on s'assure que le flag n'est pas posé.
            service.getBoardToSave().value.isCTF = true;
            service.setHasFlagOnBoard(false);
            // On met aussi les compteurs à 0 pour ne pas interférer avec l\'erreur du flag
            service['nbrSpawnsToPlace'].next(0);
            service['nbrItemsToPlace'].next(0);
            const validation: Validation = service.isReadyToSave();
            expect(validation.isValid).toBeFalse();
            expect(validation.error).toContain('drapeau');
        });
    });

    /* ==== Test de setMapData et getters associés ==== */
    it('setMapData should update firstBoardValue and localStorage', () => {
        const newBoard: Board = {
            _id: 'newId',
            name: 'New Board',
            description: 'New description',
            size: 4,
            board: [],
            isCTF: true,
            visibility: Visibility.PRIVATE,
            image: 'newImage',
            updatedAt: new Date(),
        };
        service.setMapData(newBoard);
        expect(localStorage.setItem).toHaveBeenCalledWith('firstBoardValue', JSON.stringify(newBoard));
        expect(service.getFirstBoardValue()).toEqual(newBoard);
    });

    it('getBoardToSave should return the BehaviorSubject for board', () => {
        const bs = service.getBoardToSave();
        expect(bs).toBeTruthy();
        expect(bs instanceof BehaviorSubject).toBeTrue();
    });

    /* ==== Test de la modification des propriétés du board ==== */
    it('setBoardName should update board name', () => {
        const newName = 'Updated Board Name';
        service.setBoardName(newName);
        expect(service.getBoardToSave().value.name).toEqual(newName);
    });

    it('setBoardDescription should update board description', () => {
        const newDesc = 'Updated Board Description';
        service.setBoardDescription(newDesc);
        expect(service.getBoardToSave().value.description).toEqual(newDesc);
    });

    it('getBoardSize should return the board size', () => {
        expect(service.getBoardSize()).toBe(service.getBoardToSave().value.size);
    });

    it('getCellTile should return the correct tile at specified coordinates', () => {
        // On s'assure qu'une board est générée (générée par setBoardToFirstValue)
        const cellTile = service.getCellTile(0, 0);
        expect(cellTile).toEqual(Tile.FLOOR);
    });

    it('getCellItem should return the correct item at specified coordinates', () => {
        const cellItem = service.getCellItem(0, 0);
        expect(cellItem).toEqual(Item.DEFAULT);
    });

    it('isModeCTF should return the isCTF flag from boardToSave', () => {
        const board = service.getBoardToSave().value;
        expect(service.isModeCTF()).toEqual(board.isCTF);
    });

    it('setCellTile should update the tile of the specified cell', () => {
        // Préparation d\'une grille complète pour être sûr de la structure
        const board = service.getBoardToSave().value;
        board.board = Array(board.size)
            .fill(null)
            .map((_, rowIndex) =>
                Array(board.size)
                    .fill(null)
                    .map((__, colIndex) => ({
                        tile: Tile.FLOOR,
                        item: Item.DEFAULT,
                        position: { x: colIndex, y: rowIndex },
                    })),
            );
        // On remet à jour boardToSave avec cette grille
        service['boardToSave'].next(board);
        service.setCellTile(1, 1, Tile.WALL);
        expect(service.getBoardToSave().value.board[1][1].tile).toEqual(Tile.WALL);
    });

    it('setCellItem should update the item of the specified cell', () => {
        const board = service.getBoardToSave().value;
        board.board = Array(board.size)
            .fill(null)
            .map((_, rowIndex) =>
                Array(board.size)
                    .fill(null)
                    .map((__, colIndex) => ({
                        tile: Tile.FLOOR,
                        item: Item.DEFAULT,
                        position: { x: colIndex, y: rowIndex },
                    })),
            );
        service['boardToSave'].next(board);
        service.setCellItem(2, 0, Item.FLAG);
        expect(service.getBoardToSave().value.board[0][2].item).toEqual(Item.FLAG);
    });

    /* ==== Tests sur la génération et le parsing du board ==== */
    describe('setBoardToFirstValue', () => {
        it('should set boardToSave to firstBoardValue and call parseBoard when board is not empty', () => {
            // Création d'un board personnalisé avec quelques cellules non-default
            const customBoard: Board = {
                _id: 'nonEmpty',
                name: 'Non Empty Board',
                description: 'Board already generated',
                size: 10,
                board: [
                    [
                        { tile: Tile.FLOOR, item: Item.SPAWN, position: { x: 0, y: 0 } },
                        { tile: Tile.FLOOR, item: Item.FLAG, position: { x: 1, y: 0 } },
                    ],
                    [
                        { tile: Tile.FLOOR, item: 999 as unknown as Item, position: { x: 0, y: 1 } }, // autre item non-default
                        { tile: Tile.FLOOR, item: Item.DEFAULT, position: { x: 1, y: 1 } },
                    ],
                ],
                isCTF: true,
                visibility: Visibility.PUBLIC,
                image: 'img',
                updatedAt: new Date(),
            };

            // On définit firstBoardValue avec ce board non vide.
            service['firstBoardValue'].next(customBoard);
            // Pour vérifier que parseBoard est appelé, on peut espionner la méthode privée.
            const parseSpy = spyOn<any>(service, 'parseBoard').and.callThrough();

            // On réinitialise les compteurs à la valeur max pour size 2
            const maxObj = BOARD_SIZE_MAPPING[customBoard.size as Size];
            service['nbrSpawnsToPlace'].next(maxObj);
            service['nbrItemsToPlace'].next(maxObj);
            service.setBoardToFirstValue();

            const boardSaved = service.getBoardToSave().value;
            // La board retournée doit être identique au board custom
            expect(boardSaved).toEqual(customBoard);
            expect(parseSpy).toHaveBeenCalledWith(customBoard);

            // Vérification des effets de parseBoard :
            // - Une cellule avec SPAWN : décrémente nbrSpawnsToPlace de 1
            // - Une cellule avec ITEM différent de DEFAULT, SPAWN et FLAG (ici 999) : décrémente nbrItemsToPlace de 1
            // - Une cellule avec FLAG : setHasFlagOnBoard(true) doit être appelé
            expect(service['nbrSpawnsToPlace'].value).toEqual(maxObj - 1);
            expect(service['nbrItemsToPlace'].value).toEqual(maxObj - 1);
            expect(service['hasFlagOnBoard'].value).toBeTrue();
        });
    });
});
