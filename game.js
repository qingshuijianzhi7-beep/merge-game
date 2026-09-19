// ==========================================
// グローバル変数（ファイル間で共有するため var を使用）
// ==========================================
var MAX_HP = 1000;
var globalHP = 1000, hpBarFill, hpText;
var darkBgOverlay = null;

var bossEnemy = null; 
var activeHero = null; 
var bossUI = [];
var heroShooterUI = []; 
var isShooterMode = false;
var spaceYOffset = 0; 

// ボス戦用の設定
var bossHP = 50000;
var bossMaxHP = 50000;
var timeLeft = 60;
var timerTextUI = null;
var timerEvent = null;

// 盤面の設定
var alliedUnits, enemyUnits;
var turnText, turn = 1, isTurnExecuting = false;
var COLS = 7, ENEMY_ROWS = 7, ALLIED_ROWS = 3;
var TILE_SIZE = 90;
var START_X = (720 - (TILE_SIZE * COLS)) / 2;
var ENEMY_START_Y = 120;
var ALLIED_START_Y = ENEMY_START_Y + (ENEMY_ROWS * TILE_SIZE) + 40;

// ==========================================
// 前半：パズルと進行の処理
// ==========================================
function preload() {
    this.load.image('hero', 'hero.png');
    this.load.image('arrow', 'arrow.png');
    this.load.image('enemy', 'enemy.png');
    this.load.image('enemy2', 'enemy2.png'); 
    this.load.image('enemy2_roar', 'enemy2_roar.png'); 
    this.load.image('partner', 'partner.png'); 
    this.load.image('superhero', 'superhero.png'); 
    
    this.load.audio('shoot', 'shoot.mp3');
    this.load.audio('hit', 'hit.mp3');
    this.load.audio('crowned', 'crowned.mp3');
    this.load.audio('roar', 'roar.mp3'); 
    this.load.audio('alarm', 'alarm.mp3'); 
    this.load.audio('explosion', 'explosion.mp3');
    this.load.audio('warp_out', 'warp_out.mp3'); 
    this.load.audio('warp_in', 'warp_in.mp3'); 
    this.load.audio('hero_hit', 'hero_hit.mp3'); 
}

function create() {
    const g = this.make.graphics({x: 0, y: 0, add: false});
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 3, 3); 
    g.generateTexture('star', 3, 3);

    this.input.on('pointerdown', () => {
        if (this.sound.context && this.sound.context.state === 'suspended') {
            this.sound.context.resume();
        }
    });

    turnText = this.add.text(360, 40, `TURN: ${turn}`, { fontSize: '32px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

    setupGrid(this, { x: START_X, y: ENEMY_START_Y, color: 0x4a1a1a }, ENEMY_ROWS, COLS);
    setupGrid(this, { x: START_X, y: ALLIED_START_Y, color: 0x3a3a3a }, ALLIED_ROWS, COLS);

    alliedUnits = this.add.group();
    enemyUnits = this.add.group();

    spawnAlliedUnit(this, 1, 'Hero', 3, 1, 1);
    spawnEnemyUnit(this, 1, 'Enemy', 3, 0, 1); 

    const uiY = 1150;
    this.add.text(70, uiY, 'LIFE', { fontSize: '28px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.rectangle(130, uiY, 380, 40, 0x555555).setOrigin(0, 0.5);
    hpBarFill = this.add.rectangle(130, uiY, 380, 40, 0x00e676).setOrigin(0, 0.5);
    hpText = this.add.text(320, uiY, `${globalHP} / ${MAX_HP}`, { fontSize: '22px', fill: '#000', fontStyle:'bold' }).setOrigin(0.5);

    const attackBtn = this.add.circle(620, uiY, 60, 0xff3d00).setInteractive();
    this.add.text(620, uiY, 'FIRE!', { fontSize: '28px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    attackBtn.on('pointerdown', () => executeTurn(this));

    this.input.on('drag', handleDrag, this);
    this.input.on('dragend', handleDragEnd, this);

    const skipBtn = this.add.text(10, 10, '⏩ SKIP TO BOSS', { 
        fontSize: '20px', fill: '#fff', backgroundColor: '#d32f2f', padding: { x: 10, y: 10 } 
    }).setInteractive().setDepth(9999);

    skipBtn.on('pointerdown', () => {
        skipBtn.destroy();
        this.time.timeScale = 20; 
        if (!isTurnExecuting) executeTurn(this);
    });
}

function update() {}

function setupGrid(scene, config, rows, cols) {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const tileX = config.x + c * TILE_SIZE + TILE_SIZE / 2;
            const tileY = config.y + r * TILE_SIZE + TILE_SIZE / 2;
            scene.add.rectangle(tileX, tileY, TILE_SIZE - 4, TILE_SIZE - 4, config.color).setOrigin(0.5);
        }
    }
}

function spawnAlliedUnit(scene, level, type, gridX, gridY, hp) {
    const worldX = START_X + gridX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = ALLIED_START_Y + gridY * TILE_SIZE + TILE_SIZE / 2;
    let unit;
    try {
        unit = scene.add.sprite(worldX, worldY, 'hero').setOrigin(0.5);
        unit.setDisplaySize(TILE_SIZE - 10, TILE_SIZE - 10);
    } catch (e) {
        unit = scene.add.rectangle(worldX, worldY, TILE_SIZE - 10, TILE_SIZE - 10, 0x90caf9).setOrigin(0.5);
    }
    unit.setInteractive();
    scene.input.setDraggable(unit);
    unit.setData({ isAllied: true, level: level, type: type, gridX: gridX, gridY: gridY, hp: hp });
    const text = scene.add.text(worldX, worldY + 30, `Lv${level}`, { fontSize: '20px', fill: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
    unit.setData('text', text);
    alliedUnits.add(unit);
    return unit;
}

function spawnEnemyUnit(scene, level, type, gridX, gridY, hp) {
    const worldX = START_X + gridX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = ENEMY_START_Y + gridY * TILE_SIZE + TILE_SIZE / 2;
    const unit = scene.add.sprite(worldX, worldY, 'enemy').setOrigin(0.5);
    unit.setDisplaySize(TILE_SIZE - 10, TILE_SIZE - 10);
    unit.setData({ isAllied: false, hp: hp, maxHp: hp, level: level, gridX: gridX, gridY: gridY, type: type });
    const hpTxt = scene.add.text(worldX - 12, worldY - 40, `${hp}`, { fontSize: '14px', fill: '#fff', fontStyle: 'bold' }).setOrigin(1, 0.5);
    const bgBar = scene.add.rectangle(worldX - 8, worldY - 40, 36, 6, 0x555555).setOrigin(0, 0.5);
    const hpBar = scene.add.rectangle(worldX - 8, worldY - 40, 36, 6, 0xff0000).setOrigin(0, 0.5);
    unit.setData('ui', [hpTxt, bgBar, hpBar]);
    enemyUnits.add(unit);
    return unit;
}

function takeDamage(amount, scene) {
    globalHP -= amount;
    if (globalHP < 0) globalHP = 0;
    hpBarFill.width = 380 * (globalHP / MAX_HP);
    hpText.setText(`${globalHP} / ${MAX_HP}`);
    
    if (globalHP === 0) {
        alliedUnits.getChildren().forEach(hero => {
            if (hero.getData('text')) hero.getData('text').setVisible(false);
            scene.tweens.add({ targets: hero, y: hero.y - 60, duration: 200, yoyo: true });
            scene.tweens.add({ targets: hero, angle: 90, duration: 400 });
        });
        scene.time.delayedCall(500, () => {
            scene.add.text(360, 640, 'GAME OVER', { fontSize: '80px', fill: '#ff0000', fontStyle: 'bold', stroke: '#000', strokeThickness: 8 }).setOrigin(0.5).setDepth(100);
        });
    }
}

function createDialog(scene, x, y, textString) {
    return scene.add.text(x, y, textString, { fontSize: '36px', fill: '#ff0000', fontStyle: 'bold', align: 'center', stroke: '#fff', strokeThickness: 5 }).setOrigin(0.5).setDepth(200);
}

function executeTurn(scene) {
    if (isTurnExecuting) return;
    isTurnExecuting = true;
    handleAttack(scene, () => {
        moveEnemiesForward(scene, () => {
            turn++;
            turnText.setText(`TURN: ${turn}`);
            isTurnExecuting = false;
        });
    });
}

function handleAttack(scene, onComplete) {
    const allies = alliedUnits.getChildren();
    const enemies = enemyUnits.getChildren();
    if (allies.length === 0) { if(onComplete) onComplete(); return; }

    const unit = allies[0];
    const alliedCol = unit.getData('gridX');
    const enemiesInSameCol = enemies.filter(enemy => enemy.active && enemy.getData('gridX') === alliedCol);
    let targetEnemy = null;
    if (enemiesInSameCol.length > 0) {
        enemiesInSameCol.sort((a, b) => b.getData('gridY') - a.getData('gridY'));
        targetEnemy = enemiesInSameCol[0];
    }

    let arrow;
    try {
        arrow = scene.add.sprite(unit.x, unit.y, 'arrow').setOrigin(0.5);
        arrow.setDisplaySize(30, 70);
    } catch(e) {
        arrow = scene.add.rectangle(unit.x, unit.y, 8, 80, 0xffea00).setOrigin(0.5);
    }
    scene.physics.add.existing(arrow);
    arrow.body.setVelocityY(-1200);
    try { scene.sound.play('shoot'); } catch(e) {}

    const damage = unit.getData('level') * 25; 
    let hitDone = false;

    const updateEvent = scene.time.addEvent({
        delay: 20, loop: true,
        callback: () => {
            if (arrow.y < -50) {
                arrow.destroy(); updateEvent.remove();
                if (onComplete) onComplete(); return;
            }

            if (targetEnemy && targetEnemy.active && !hitDone) {
                if (arrow.y <= targetEnemy.y + TILE_SIZE/2) {
                    hitDone = true;
                    try { scene.sound.play('hit'); } catch(e) {}
                    
                    const currentHP = targetEnemy.getData('hp');
                    const newHP = currentHP - damage;
                    
                    arrow.destroy();
                    updateEvent.remove();

                    if (newHP <= 0) {
                        targetEnemy.setData('hp', 0);
                        const ui = targetEnemy.getData('ui');
                        ui[0].setText(`0`); ui[2].width = 0;

                        scene.tweens.add({
                            targets: targetEnemy, x: targetEnemy.x + 15, duration: 50, yoyo: true, repeat: 5,
                            onComplete: () => {
                                darkBgOverlay = scene.add.rectangle(360, 640, 720, 1280, 0x000000, 0.8).setDepth(40);
                                targetEnemy.setDepth(50);
                                ui.forEach(u => u.setVisible(false));

                                scene.tweens.add({
                                    targets: targetEnemy, x: 360, y: 640, displayWidth: 640, displayHeight: 640, duration: 1000,
                                    onComplete: () => {
                                        const dialogueText = scene.add.text(360, 1050, "あれ？僕誕生日だよね？？", { 
                                            fontSize: '36px', fill: '#ff0000', fontStyle: 'bold', align: 'center', stroke: '#fff', strokeThickness: 5 
                                        }).setOrigin(0.5).setDepth(60);

                                        scene.time.delayedCall(3000, () => {
                                            dialogueText.setText("なんで攻撃されるの？？");
                                            scene.time.delayedCall(3000, () => {
                                                dialogueText.setText("許さん。殺す！");
                                                scene.time.delayedCall(2000, () => {
                                                    dialogueText.setVisible(false);
                                                    try { scene.sound.play('crowned'); } catch(e) {}

                                                    const whiteSilhouette = scene.add.sprite(targetEnemy.x, targetEnemy.y, 'enemy').setOrigin(0.5);
                                                    whiteSilhouette.setDisplaySize(targetEnemy.displayWidth, targetEnemy.displayHeight);
                                                    whiteSilhouette.setTintFill(0xffffff);
                                                    whiteSilhouette.setAlpha(0); whiteSilhouette.setDepth(targetEnemy.depth + 1);
                                                    
                                                    const targetBossX = targetEnemy.x + 120;
                                                    const targetBossY = targetEnemy.y - 180;
                                                    scene.tweens.add({ targets: targetEnemy, x: targetBossX, y: targetBossY, duration: 1500, ease: 'Power2' });
                                                    scene.tweens.add({ targets: whiteSilhouette, x: targetBossX, y: targetBossY, duration: 1500, ease: 'Power2' });

                                                    const screenLight = scene.add.rectangle(360, 640, 720, 1280, 0xffffff).setOrigin(0.5);
                                                    screenLight.setAlpha(0); screenLight.setDepth(100);

                                                    scene.tweens.add({
                                                        targets: [whiteSilhouette, screenLight], alpha: 1, duration: 1500, ease: 'Power2',
                                                        onComplete: () => {
                                                            targetEnemy.setVisible(false); whiteSilhouette.destroy();
                                                            bossEnemy = scene.add.sprite(360, 480, 'enemy2').setOrigin(0.5);
                                                            bossEnemy.setDisplaySize(500, 500); bossEnemy.setDepth(50);

                                                            scene.time.delayedCall(1000, () => {
                                                                scene.tweens.add({
                                                                    targets: screenLight, alpha: 0, duration: 2500, ease: 'Linear',
                                                                    onComplete: () => {
                                                                        bossEnemy.setTexture('enemy2_roar');
                                                                        try { scene.sound.play('roar'); } catch(e) {} 
                                                                        scene.cameras.main.shake(1500, 0.02);

                                                                        const shockwave = scene.add.circle(bossEnemy.x, bossEnemy.y + 40, 20).setStrokeStyle(8, 0xffffff, 1).setDepth(60);
                                                                        scene.tweens.add({ 
                                                                            targets: shockwave, radius: 500, alpha: 0, duration: 1500, ease: 'Cubic.easeOut', 
                                                                            onComplete: () => {
                                                                                shockwave.destroy(); bossEnemy.setTexture('enemy2');
                                                                                const baseW = 500, baseH = 500, baseY = 480;
                                                                                scene.tweens.add({
                                                                                    targets: bossEnemy, displayHeight: baseH * 0.75, displayWidth: baseW * 1.15, y: baseY + 85, duration: 700, ease: 'Sine.easeInOut',
                                                                                    onComplete: () => {
                                                                                        scene.tweens.add({
                                                                                            targets: bossEnemy, displayHeight: baseH * 1.1, displayWidth: baseW * 0.9, y: -500, duration: 700, delay: 300, ease: 'Cubic.easeIn',
                                                                                            onComplete: () => {
                                                                                                if (darkBgOverlay) { darkBgOverlay.destroy(); darkBgOverlay = null; }
                                                                                                bossEnemy.setDisplaySize(500, 500); 
                                                                                                scene.tweens.add({
                                                                                                    targets: bossEnemy, y: 480, duration: 2500, delay: 500, ease: 'Sine.easeInOut',
                                                                                                    onComplete: () => {
                                                                                                        const hpBarWidth = 680;
                                                                                                        const bossHpBg = scene.add.rectangle(20, 60, hpBarWidth, 24, 0x555555).setOrigin(0, 0.5).setDepth(100);
                                                                                                        const bossHpFill = scene.add.rectangle(20, 60, 0, 24, 0xff0000).setOrigin(0, 0.5).setDepth(101);
                                                                                                        const bossNameText = scene.add.text(20, 25, "", { fontSize: '22px', fill: '#ff3333', fontStyle: 'bold', stroke: '#fff', strokeThickness: 3 }).setDepth(100);
                                                                                                        bossUI = [bossHpBg, bossHpFill, bossNameText];
                                                                                                        scene.tweens.add({ targets: bossHpFill, width: hpBarWidth, duration: 1500, ease: 'Power3.easeOut', 
                                                                                                            onComplete: () => { 
                                                                                                                // ★ボス戦ファイル(boss.js)の処理を呼び出す！
                                                                                                                startFusionEvent(scene); 
                                                                                                            } 
                                                                                                        });
                                                                                                    }
                                                                                                });
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                });
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            });
                                                        }
                                                    });
                                                });
                                            });
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        targetEnemy.setData('hp', newHP);
                        const ui = targetEnemy.getData('ui');
                        const maxHp = targetEnemy.getData('maxHp');
                        ui[0].setText(`${newHP}`); ui[2].width = 36 * (newHP / maxHp);
                        scene.time.delayedCall(500, () => { if (onComplete) onComplete(); });
                    }
                }
            }
        }
    });
}

function moveEnemiesForward(scene, onComplete) {
    const enemies = enemyUnits.getChildren();
    let enemiesToDestroy = [];
    let isGameOverThisTurn = false; 

    if(enemies.length === 0) { if(onComplete) onComplete(); return; }

    enemies.forEach(enemy => {
        if (!enemy.active) return;
        let newY = enemy.getData('gridY') + 1;
        enemy.setData('gridY', newY);

        if (newY >= ENEMY_ROWS) {
            const invasionY = ALLIED_START_Y + 1 * TILE_SIZE + TILE_SIZE / 2;
            scene.tweens.add({ targets: enemy, y: invasionY, duration: 300 });
            scene.tweens.add({ targets: enemy.getData('ui'), y: invasionY - 40, duration: 300 });
            
            isGameOverThisTurn = true; 
            enemiesToDestroy.push(enemy);
        } else {
            const worldY = ENEMY_START_Y + newY * TILE_SIZE + TILE_SIZE / 2;
            scene.tweens.add({ targets: enemy, y: worldY, duration: 300 });
            scene.tweens.add({ targets: enemy.getData('ui'), y: worldY - 40, duration: 300 });
        }
    });

    scene.time.delayedCall(350, () => { 
        enemiesToDestroy.forEach(e => {
            if (e.getData('ui')) e.getData('ui').forEach(ui => ui.destroy());
            e.destroy();
        });
        if (isGameOverThisTurn) { try { scene.sound.play('hit'); } catch(e) {} takeDamage(1000, scene); }
        if(onComplete) onComplete(); 
    });
}

function handleDrag(pointer, gameObject, dragX, dragY) {
    if (isShooterMode) {
        if (gameObject.getData('isAllied')) {
            gameObject.x = Phaser.Math.Clamp(dragX, 50, 670);
            gameObject.y = Phaser.Math.Clamp(dragY, 100 + spaceYOffset, 1180 + spaceYOffset);
        }
        return;
    }
    if (isTurnExecuting) return;
    gameObject.x = dragX; gameObject.y = dragY;
    gameObject.getData('text').x = dragX; gameObject.getData('text').y = dragY + 30; 
    gameObject.setDepth(10); gameObject.getData('text').setDepth(11);
}

function handleDragEnd(pointer, gameObject) {
    if (isShooterMode) return;
    gameObject.setDepth(0); gameObject.getData('text').setDepth(0);
    const scene = gameObject.scene;
    if (isTurnExecuting) { returnAllUnitToPosition(gameObject); return; }

    const dropGridX = Math.floor((gameObject.x - START_X) / TILE_SIZE);
    const dropGridY = Math.floor((gameObject.y - ALLIED_START_Y) / TILE_SIZE);
    const oldX = gameObject.getData('gridX'); const oldY = gameObject.getData('gridY');

    if (dropGridX < 0 || dropGridX >= COLS || dropGridY < 0 || dropGridY >= ALLIED_ROWS || (dropGridX === oldX && dropGridY === oldY)) {
        returnAllUnitToPosition(gameObject); return;
    }

    let targetUnit = null;
    alliedUnits.getChildren().forEach(unit => { if (unit !== gameObject && unit.getData('gridX') === dropGridX && unit.getData('gridY') === dropGridY) targetUnit = unit; });

    if (targetUnit && targetUnit.getData('type') === gameObject.getData('type') && targetUnit.getData('level') === gameObject.getData('level')) {
        const newLevel = gameObject.getData('level') + 1;
        const type = gameObject.getData('type');
        if (gameObject.getData('text')) gameObject.getData('text').destroy();
        if (targetUnit.getData('text')) targetUnit.getData('text').destroy();
        alliedUnits.remove(gameObject, true, true); alliedUnits.remove(targetUnit, true, true);
        spawnAlliedUnit(scene, newLevel, type, dropGridX, dropGridY, 10);
        executeTurn(scene);
    } else if (!targetUnit) {
        gameObject.setData('gridX', dropGridX); gameObject.setData('gridY', dropGridY);
        returnAllUnitToPosition(gameObject); executeTurn(scene);
    } else { returnAllUnitToPosition(gameObject); }
}

function returnAllUnitToPosition(unit) {
    const worldX = START_X + unit.getData('gridX') * TILE_SIZE + TILE_SIZE / 2;
    const worldY = ALLIED_START_Y + unit.getData('gridY') * TILE_SIZE + TILE_SIZE / 2;
    unit.x = worldX; unit.y = worldY;
    unit.getData('text').x = worldX; unit.getData('text').y = worldY + 30; 
}

// ゲームの起動設定
const config = {
    type: Phaser.AUTO,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 720, height: 1280, parent: 'game-container' },
    backgroundColor: '#1e1e1e',
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: { preload: preload, create: create, update: update }
};
const game = new Phaser.Game(config);
