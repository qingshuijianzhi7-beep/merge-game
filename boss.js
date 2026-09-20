// ==========================================
// ★ GIFと音のタイミング設定
// ==========================================

// ↓ ここを「const」ではなく「var」にしました！これで絶対にフリーズしません！
var TIMEOVER_GIF_FILES = [
    'destroy1.gif', // 1枚目
    'destroy2.gif', // 2枚目
    'destroy3.gif', // 3枚目
    'destroy4.gif'  // 4枚目（後で作るもの）
];
var GIF_CHANGE_INTERVAL = 3000;
var EXPLOSION_SOUND_DELAY = 1000;

// ==========================================
// 後半：ボス戦（シューティングモード）の全処理
// ==========================================
var bossAttackCycle = 0; 
var isShooterTimeOver = false; // タイムオーバー時の絶対的な攻撃ストッパー

function startFusionEvent(scene) {
    const hero = alliedUnits.getChildren()[0];
    if (!hero) return;
    activeHero = hero; 

    scene.cameras.main.pan(hero.x, hero.y, 1000, 'Power2');
    scene.cameras.main.zoomTo(2, 1000, 'Power2');

    scene.time.delayedCall(1700, () => {
        const heroText1 = createDialog(scene, hero.x, hero.y - 70, "やばくね？");
        scene.time.delayedCall(2000, () => {
            heroText1.destroy();
            const partner = scene.add.sprite(hero.x + 200, hero.y, 'partner').setOrigin(0.5);
            partner.setDisplaySize(TILE_SIZE - 10, TILE_SIZE - 10); partner.setDepth(hero.depth + 1);

            scene.tweens.add({
                targets: partner, x: hero.x + 70, duration: 800, ease: 'Power2.easeOut',
                onComplete: () => {
                    const partnerText = createDialog(scene, partner.x, partner.y - 70, "合体しよ！");
                    scene.time.delayedCall(2000, () => {
                        partnerText.destroy();
                        const heroText2 = createDialog(scene, hero.x, hero.y - 70, "いいよ！");
                        scene.time.delayedCall(2000, () => {
                            heroText2.destroy();
                            scene.tweens.add({ targets: partner, x: hero.x, duration: 800, ease: 'Power2.easeIn' });

                            const flash = scene.add.rectangle(hero.x, hero.y, 3000, 3000, 0xffffff).setOrigin(0.5).setDepth(200);
                            flash.setAlpha(0);

                            scene.tweens.add({
                                targets: flash, alpha: 1, duration: 800, yoyo: true, hold: 500,
                                onYoyo: () => {
                                    hero.setTexture('superhero'); hero.setDisplaySize(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
                                    partner.destroy();
                                    if (hero.getData('text')) hero.getData('text').setVisible(false);
                                },
                                onComplete: () => {
                                    flash.destroy();
                                    const heroText3 = createDialog(scene, hero.x, hero.y - 70, "・・・殺す！");
                                    scene.time.delayedCall(2500, () => {
                                        heroText3.destroy();
                                        scene.cameras.main.pan(360, 640, 1000, 'Power2');
                                        scene.cameras.main.zoomTo(1, 1000, 'Power2');
                                        scene.time.delayedCall(1700, () => { transitionToShooter(scene, hero); });
                                    });
                                }
                            });
                        });
                    });
                }
            });
        });
    });
}

function transitionToShooter(scene, hero) {
    turnText.setVisible(false);
    const heroBaseH = hero.displayHeight; const heroBaseW = hero.displayWidth;
    const bossBaseH = bossEnemy.displayHeight; const bossBaseW = bossEnemy.displayWidth;
    
    scene.tweens.add({ targets: hero, displayHeight: heroBaseH * 0.6, displayWidth: heroBaseW * 1.3, y: hero.y + (heroBaseH * 0.2), duration: 1000, ease: 'Sine.easeOut' });
    scene.tweens.add({
        targets: bossEnemy, displayHeight: bossBaseH * 0.7, displayWidth: bossBaseW * 1.2, y: bossEnemy.y + (bossBaseH * 0.15), duration: 1000, ease: 'Sine.easeOut',
        onComplete: () => {
            scene.tweens.add({ targets: hero, displayHeight: heroBaseH * 1.2, displayWidth: heroBaseW * 0.8, y: -1500, duration: 400, ease: 'Cubic.easeIn' });
            scene.tweens.add({
                targets: bossEnemy, displayHeight: bossBaseH * 1.1, displayWidth: bossBaseW * 0.9, y: -1500, duration: 400, ease: 'Cubic.easeIn',
                onComplete: () => {
                    hero.setDisplaySize(heroBaseW, heroBaseH); bossEnemy.setDisplaySize(bossBaseW, bossBaseH);
                    
                    // UIリセット（念のため安全確認を入れて消去）
                    if (typeof bossUI !== 'undefined' && bossUI) {
                        bossUI.forEach(ui => { if(ui) ui.destroy() }); 
                    }
                    bossUI = [];

                    scene.time.delayedCall(800, () => {
                        spaceYOffset = -1280; 
                        scene.add.rectangle(360, -640, 720, 1280, 0x000000).setDepth(250);
                        scene.add.particles(0, -1400, 'star', { x: { min: 0, max: 720 }, y: 0, lifespan: 3000, speedY: { min: 1000, max: 3000 }, scale: { min: 0.5, max: 1.0 }, alpha: { min: 0.3, max: 0.8 }, quantity: 15, blendMode: 'ADD' }).setDepth(251);
                        scene.cameras.main.pan(360, -640, 2000, 'Sine.easeInOut');
                        scene.time.delayedCall(2000, () => { startShooterMode(scene, hero); });
                    });
                }
            });
        }
    });
}

function startShooterMode(scene, hero) {
    scene.time.timeScale = 1; 
    isShooterMode = true;
    isShooterTimeOver = false;
    bossAttackCycle = 0; 
    
    hero.setDepth(260); bossEnemy.setDepth(260);
    
    hero.x = 360; hero.y = 200; 
    scene.tweens.add({ targets: hero, y: -280, duration: 1000, ease: 'Power2' });
    
    bossEnemy.x = 360; bossEnemy.y = -1600; 
    scene.tweens.add({
        targets: bossEnemy, y: -1030, duration: 1000, ease: 'Power2',
        onComplete: () => {
            const hpBarWidth = 660;
            const bossHpBg = scene.add.rectangle(30, 60, hpBarWidth, 24, 0x555555).setOrigin(0, 0.5).setDepth(300).setScrollFactor(0).setVisible(false);
            const bossHpFill = scene.add.rectangle(30, 60, 0, 24, 0xff0000).setOrigin(0, 0.5).setDepth(301).setScrollFactor(0).setVisible(false);
            const bossNameText = scene.add.text(30, 25, "", { fontFamily: '"Impact", "Arial Black", sans-serif', fontSize: '28px', fill: '#ff3333', fontStyle: 'bold', stroke: '#fff', strokeThickness: 4 }).setOrigin(0, 0.5).setDepth(300).setScrollFactor(0).setVisible(false);
            bossUI = [bossHpBg, bossHpFill, bossNameText];

            bossHP = bossMaxHP;
            globalHP = 1000;
            
            const heroHpBg = scene.add.rectangle(30, 1220, hpBarWidth, 24, 0x555555).setOrigin(0, 0.5).setDepth(300).setScrollFactor(0).setVisible(false);
            const heroHpFill = scene.add.rectangle(30, 1220, 0, 24, 0x00e676).setOrigin(0, 0.5).setDepth(301).setScrollFactor(0).setVisible(false);
            const heroNameText = scene.add.text(30, 1185, "HP: 1000 / 1000", { fontFamily: '"Impact", "Arial Black", sans-serif', fontSize: '28px', fill: '#00e676', fontStyle: 'bold', stroke: '#fff', strokeThickness: 4 }).setOrigin(0, 0.5).setDepth(300).setScrollFactor(0).setVisible(false);
            heroShooterUI = [heroHpBg, heroHpFill, heroNameText];

            timeLeft = 60;
            timerTextUI = scene.add.text(30, 100, `ゲームオーバーまであと ${timeLeft}秒`, { 
                fontFamily: '"Impact", "Arial Black", sans-serif', fontSize: '26px', fill: '#ff5555', fontStyle: 'bold', stroke: '#fff', strokeThickness: 4 
            }).setOrigin(0, 0.5).setDepth(300).setScrollFactor(0).setVisible(false);

            const instructionText = scene.add.text(360, -640, "そーごを操作して、\nしゅんを倒せ！！", { fontFamily: '"Impact", "Arial Black", sans-serif', fontSize: '60px', fill: '#ffeb3b', fontStyle: 'bold', align: 'center', stroke: '#ff0000', strokeThickness: 10, shadow: { offsetX: 4, offsetY: 4, color: '#000', blur: 8, fill: true } }).setOrigin(0.5).setDepth(400);

            scene.tweens.add({
                targets: instructionText, scaleX: 1.15, scaleY: 1.15, duration: 200, yoyo: true, repeat: 5,
                onStart: () => { try { scene.sound.play('alarm'); } catch(e) {} },
                onRepeat: () => { try { scene.sound.play('alarm'); } catch(e) {} },
                onComplete: () => {
                    scene.time.delayedCall(300, () => {
                        instructionText.destroy();
                        
                        bossHpBg.setVisible(true); bossHpFill.setVisible(true); bossNameText.setVisible(true);
                        heroHpBg.setVisible(true); heroHpFill.setVisible(true); heroNameText.setVisible(true);
                        
                        scene.tweens.add({
                            targets: [bossHpFill, heroHpFill], width: hpBarWidth, duration: 1200, ease: 'Power3.easeOut',
                            onComplete: () => {
                                timerTextUI.setVisible(true);
                                
                                // ==========================================
                                // ★ タイムオーバー時の絶望演出
                                // ==========================================
                                timerEvent = scene.time.addEvent({
                                    delay: 1000, loop: true,
                                    callback: () => {
                                        if (!isShooterMode || isShooterTimeOver) return;
                                        timeLeft--;
                                        if (timerTextUI) timerTextUI.setText(`ゲームオーバーまであと ${timeLeft}秒`);
                                        
                                        // ★ 時間切れ
                                        if (timeLeft <= 0) {
                                            isShooterMode = false;
                                            isShooterTimeOver = true; // ボスの攻撃を完全ストップ
                                            timerEvent.remove();
                                            
                                            // ボスの動きを強制停止
                                            scene.tweens.killTweensOf(bossEnemy);

                                            // ★ ヒーローが消えないように「ダミー」を作り、本物を隠す
                                            let currentHeroX = 360, currentHeroY = -350, currentW = 120, currentH = 120;
                                            if (activeHero) {
                                                currentHeroX = activeHero.x;
                                                currentHeroY = activeHero.y;
                                                currentW = activeHero.displayWidth;
                                                currentH = activeHero.displayHeight;
                                                
                                                activeHero.setVisible(false); // 本物を隠す
                                                if (activeHero.body) {
                                                    activeHero.body.setVelocity(0, 0);
                                                    activeHero.body.moves = false; 
                                                }
                                            }

                                            // ダミーのヒーロー（Depth: 260で背景より手前！）
                                            const cinematicHero = scene.add.sprite(currentHeroX, currentHeroY, 'superhero').setDepth(260);
                                            cinematicHero.setDisplaySize(currentW, currentH);

                                            timerTextUI.setVisible(false);
                                            bossUI.forEach(ui => { if(ui) ui.setVisible(false); });
                                            heroShooterUI.forEach(ui => { if(ui) ui.setVisible(false); });

                                            // 1. 画面中央に馬鹿でかい「0」を出す
                                            const zeroText = scene.add.text(360, -640, "0", { 
                                                fontSize: '250px', fill: '#ff0000', fontStyle: 'bold', stroke: '#fff', strokeThickness: 15 
                                            }).setOrigin(0.5).setDepth(400);
                                            zeroText.setScale(0.1);
                                            
                                            scene.tweens.add({
                                                targets: zeroText,
                                                scaleX: 1.5, scaleY: 1.5,
                                                duration: 1000, ease: 'Bounce.easeOut',
                                                onComplete: () => {
                                                    scene.time.delayedCall(1000, () => {
                                                        zeroText.destroy();

                                                        // ダミーヒーローを画面中央（ビーム直撃位置）へ強制移動
                                                        scene.tweens.add({
                                                            targets: cinematicHero,
                                                            x: 360,
                                                            y: -350, 
                                                            duration: 1500,
                                                            ease: 'Power2'
                                                        });

                                                        // 2. ボスがスーッと上へ移動（ワープなし）
                                                        scene.tweens.add({
                                                            targets: bossEnemy, 
                                                            y: -1150, 
                                                            x: 360,
                                                            duration: 2000,
                                                            ease: 'Sine.easeInOut',
                                                            onComplete: () => {
                                                                // 3. 赤文字のセリフ
                                                                const winText = scene.add.text(360, bossEnemy.y + 250, "はい！僕の勝ち！", { 
                                                                    fontSize: '60px', fill: '#ff0000', fontStyle: 'bold', align: 'center', stroke: '#fff', strokeThickness: 8 
                                                                }).setOrigin(0.5).setDepth(400);

                                                                scene.time.delayedCall(2000, () => {
                                                                    winText.destroy();
                                                                    
                                                                    // 4. 横にゆっくり伸びる
                                                                    scene.tweens.add({
                                                                        targets: bossEnemy, 
                                                                        displayWidth: 1000, 
                                                                        displayHeight: 300, 
                                                                        duration: 1500, 
                                                                        ease: 'Sine.easeOut',
                                                                        onComplete: () => {
                                                                            
                                                                            // 5. エネルギー球溜め
                                                                            try { scene.sound.play('charge', { volume: 3.0 }); } catch(e){} 
                                                                            
                                                                            const chargeBall = scene.add.circle(360, bossEnemy.y + 150, 10, 0xffffff).setDepth(260);
                                                                            const chargeAura = scene.add.circle(360, bossEnemy.y + 150, 20, 0x00ffff, 0.6).setDepth(259);
                                                                            chargeBall.setBlendMode(Phaser.BlendModes.ADD);
                                                                            chargeAura.setBlendMode(Phaser.BlendModes.ADD);

                                                                            scene.tweens.add({
                                                                                targets: chargeBall, alpha: 0.1, duration: 60, yoyo: true, repeat: -1 
                                                                            });

                                                                            scene.tweens.add({
                                                                                targets: [chargeBall, chargeAura],
                                                                                radius: 350,
                                                                                duration: 3000, 
                                                                                ease: 'Cubic.easeInOut',
                                                                                onComplete: () => {
                                                                                    chargeBall.destroy();
                                                                                    chargeAura.destroy();
                                                                                    
                                                                                    // 6. 馬鹿でかい楕円形の極太ビーム発射！
                                                                                    try { scene.sound.play('launch', { volume: 4.0 }); } catch(e) {}
                                                                                    
                                                                                    const boomTimer = scene.time.addEvent({
                                                                                        delay: 150, loop: true,
                                                                                        callback: () => { try { scene.sound.play('explode', { volume: 2.0 }); } catch(e) {} }
                                                                                    });

                                                                                    scene.cameras.main.shake(3000, 0.05);

                                                                                    const beamY = bossEnemy.y + 150;
                                                                                    
                                                                                    // ★ ビームのDepthは300番台。ダミーヒーロー(260)を完全に飲み込む！
                                                                                    const outerBeam = scene.add.ellipse(360, beamY, 2000, 3500, 0x00ffff, 0.5).setOrigin(0.5, 0).setDepth(300);
                                                                                    const midBeam = scene.add.ellipse(360, beamY, 1200, 3500, 0x88ffff, 0.8).setOrigin(0.5, 0).setDepth(301);
                                                                                    const coreBeam = scene.add.ellipse(360, beamY, 600, 3500, 0xffffff, 1.0).setOrigin(0.5, 0).setDepth(302);
                                                                                    
                                                                                    outerBeam.scaleY = 0; midBeam.scaleY = 0; coreBeam.scaleY = 0;
                                                                                    outerBeam.setBlendMode(Phaser.BlendModes.ADD);
                                                                                    midBeam.setBlendMode(Phaser.BlendModes.ADD);
                                                                                    coreBeam.setBlendMode(Phaser.BlendModes.ADD);
                                                                                    
                                                                                    const energyLines = [];
                                                                                    for (let i = 0; i < 40; i++) {
                                                                                        const lineX = 360 + Phaser.Math.Between(-800, 800);
                                                                                        const lineW = Phaser.Math.Between(3, 10); 
                                                                                        const lineH = Phaser.Math.Between(200, 600);
                                                                                        const line = scene.add.rectangle(lineX, beamY, lineW, lineH, 0xffffff, 0.9).setOrigin(0.5, 0).setDepth(303);
                                                                                        line.setBlendMode(Phaser.BlendModes.ADD);
                                                                                        
                                                                                        const lineTween = scene.tweens.add({
                                                                                            targets: line, y: beamY + 3500, duration: Phaser.Math.Between(150, 300), repeat: -1, delay: Phaser.Math.Between(0, 100)
                                                                                        });
                                                                                        energyLines.push({ rect: line, tween: lineTween });
                                                                                    }

                                                                                    // 楕円ビームを一気に下まで伸ばす
                                                                                    scene.tweens.add({
                                                                                        targets: [outerBeam, midBeam, coreBeam],
                                                                                        scaleY: 1, 
                                                                                        duration: 150, 
                                                                                        ease: 'Power2',
                                                                                        onComplete: () => {
                                                                                            
                                                                                            // 7. 1秒間ビームを浴びる（この間ヒーローはビームに隠れて見えなくなります）
                                                                                            scene.time.delayedCall(1000, () => {
                                                                                                
                                                                                                // 8. ホワイトアウト
                                                                                                const whiteOut = scene.add.rectangle(360, -640, 2000, 3000, 0xffffff).setDepth(400);
                                                                                                scene.tweens.add({
                                                                                                    targets: whiteOut,
                                                                                                    alpha: { from: 0, to: 1 },
                                                                                                    duration: 1000,
                                                                                                    onComplete: () => {
                                                                                                        energyLines.forEach(item => { item.tween.remove(); item.rect.destroy(); });
                                                                                                        boomTimer.remove(); 
                                                                                                        
                                                                                                        // ホワイトアウト後にダミーヒーローも本物も完全に消去
                                                                                                        if (cinematicHero) cinematicHero.destroy();
                                                                                                        if (activeHero) activeHero.destroy();
                                                                                                        
                                                                                                        // =====================================
                                                                                                        // 9. 星々破壊GIFの連続表示 ＆ 大爆発音
                                                                                                        // =====================================
                                                                                                        const gifImg = document.createElement('img');
                                                                                                        gifImg.src = TIMEOVER_GIF_FILES[0]; 
                                                                                                        gifImg.style.position = 'absolute';
                                                                                                        gifImg.style.top = '0';
                                                                                                        gifImg.style.left = '0';
                                                                                                        gifImg.style.width = '100vw';
                                                                                                        gifImg.style.height = '100vh';
                                                                                                        gifImg.style.objectFit = 'cover';
                                                                                                        gifImg.style.zIndex = '9999';
                                                                                                        document.body.appendChild(gifImg);

                                                                                                        const playExplosion = () => {
                                                                                                            scene.time.delayedCall(EXPLOSION_SOUND_DELAY, () => {
                                                                                                                try { scene.sound.play('mass_explode', { volume: 5.0 }); } catch(e){}
                                                                                                                scene.cameras.main.shake(2000, 0.08); 
                                                                                                            });
                                                                                                        };
                                                                                                        
                                                                                                        playExplosion();

                                                                                                        let currentGifIndex = 0;
                                                                                                        const gifTimer = setInterval(() => {
                                                                                                            currentGifIndex++;
                                                                                                            if (currentGifIndex < TIMEOVER_GIF_FILES.length) {
                                                                                                                gifImg.src = TIMEOVER_GIF_FILES[currentGifIndex];
                                                                                                                playExplosion();
                                                                                                            } else {
                                                                                                                clearInterval(gifTimer);
                                                                                                                const overText = document.createElement('div');
                                                                                                                overText.innerText = 'GAME OVER';
                                                                                                                overText.style.position = 'absolute';
                                                                                                                overText.style.top = '50%';
                                                                                                                overText.style.left = '50%';
                                                                                                                overText.style.transform = 'translate(-50%, -50%)';
                                                                                                                overText.style.color = '#ff0000';
                                                                                                                overText.style.fontSize = '80px';
                                                                                                                overText.style.fontWeight = 'bold';
                                                                                                                overText.style.fontFamily = '"Impact", "Arial Black", sans-serif';
                                                                                                                overText.style.zIndex = '10000';
                                                                                                                overText.style.textShadow = '0px 0px 15px #000';
                                                                                                                document.body.appendChild(overText);
                                                                                                            }
                                                                                                        }, GIF_CHANGE_INTERVAL);
                                                                                                    }
                                                                                                });
                                                                                            });
                                                                                        }
                                                                                    });
                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                                });
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    }
                                });

                                startAutoShooting(scene, hero);
                                scene.time.delayedCall(1000, () => startBossAttack(scene));
                            }
                        });
                    });
                }
            });
        }
    });
}

function startBossAttack(scene) {
    if (isShooterTimeOver) return;
    executeTeleportAttack(scene, 0);
}

function executeTeleportAttack(scene, count) {
    if (!bossEnemy || !bossEnemy.active || !isShooterMode || isShooterTimeOver) return;

    const baseW = 500;
    const baseH = 500;

    if (count === 4) {
        try { scene.sound.play('warp_out', { volume: 3.0 }); } catch(e) {}
        scene.tweens.add({
            targets: bossEnemy, displayWidth: 0, displayHeight: baseH * 1.5, alpha: 0, duration: 300, ease: 'Expo.easeIn', 
            onComplete: () => {
                if (isShooterTimeOver) return; 
                bossEnemy.x = 360; bossEnemy.y = -900; 
                scene.time.delayedCall(200, () => {
                    if (isShooterTimeOver) return;
                    try { scene.sound.play('warp_in', { volume: 3.0 }); } catch(e) {}
                    scene.tweens.add({
                        targets: bossEnemy, displayWidth: baseW, displayHeight: baseH, alpha: 1, duration: 300, ease: 'Expo.easeOut', 
                        onComplete: () => {
                            if (isShooterTimeOver) return;
                            if (bossAttackCycle === 0) {
                                scene.time.delayedCall(500, () => {
                                    if (isShooterTimeOver) return;
                                    fireMissile(scene, bossEnemy.x, bossEnemy.y, () => {
                                        if (isShooterTimeOver) return;
                                        bossAttackCycle = 1; 
                                        scene.time.delayedCall(1000, () => executeTeleportAttack(scene, 0));
                                    });
                                });
                            } else {
                                executeBeamSequence(scene, 0, () => {
                                    if (isShooterTimeOver) return;
                                    bossAttackCycle = 0; 
                                    scene.time.delayedCall(1000, () => executeTeleportAttack(scene, 0));
                                });
                            }
                        }
                    });
                });
            }
        });
        return;
    }

    try { scene.sound.play('warp_out', { volume: 3.0 }); } catch(e) {}
    scene.tweens.add({
        targets: bossEnemy, displayWidth: 0, displayHeight: baseH * 1.5, alpha: 0, duration: 300, ease: 'Expo.easeIn', 
        onComplete: () => {
            if (isShooterTimeOver) return;
            bossEnemy.x = Phaser.Math.Between(150, 570);
            bossEnemy.y = Phaser.Math.Between(-1200, -450); 
            scene.time.delayedCall(200, () => { 
                if (isShooterTimeOver) return;
                try { scene.sound.play('warp_in', { volume: 3.0 }); } catch(e) {}
                scene.tweens.add({
                    targets: bossEnemy, displayWidth: baseW, displayHeight: baseH, alpha: 1, duration: 300, ease: 'Expo.easeOut', 
                    onComplete: () => {
                        if (isShooterTimeOver) return;
                        fireCircleBullets(scene, bossEnemy.x, bossEnemy.y);
                        executeTeleportAttack(scene, count + 1);
                    }
                });
            });
        }
    });
}

function executeBeamSequence(scene, step, onComplete) {
    if (!bossEnemy || !bossEnemy.active || !isShooterMode || isShooterTimeOver) return;

    if (step === 0) {
        chargeAndFireBeam(scene, () => {
            if (isShooterTimeOver) return;
            scene.time.delayedCall(1000, () => executeBeamSequence(scene, 1, onComplete));
        });
    } else {
        const targetX = (step === 1) ? 150 : 570;
        const targetY = -900;
        
        try { scene.sound.play('warp_out', { volume: 3.0 }); } catch(e) {}
        const baseW = 500, baseH = 500;
        scene.tweens.add({
            targets: bossEnemy, displayWidth: 0, displayHeight: baseH * 1.5, alpha: 0, duration: 300, ease: 'Expo.easeIn',
            onComplete: () => {
                if (isShooterTimeOver) return;
                bossEnemy.x = targetX; bossEnemy.y = targetY;
                scene.time.delayedCall(200, () => {
                    if (isShooterTimeOver) return;
                    try { scene.sound.play('warp_in', { volume: 3.0 }); } catch(e) {}
                    scene.tweens.add({
                        targets: bossEnemy, displayWidth: baseW, displayHeight: baseH, alpha: 1, duration: 300, ease: 'Expo.easeOut',
                        onComplete: () => {
                            if (isShooterTimeOver) return;
                            fireCircleBullets(scene, bossEnemy.x, bossEnemy.y);
                            chargeAndFireBeam(scene, () => {
                                if (isShooterTimeOver) return;
                                if (step === 1) {
                                    scene.time.delayedCall(1000, () => executeBeamSequence(scene, 2, onComplete));
                                } else {
                                    if (onComplete) onComplete();
                                }
                            });
                        }
                    });
                });
            }
        });
    }
}

function chargeAndFireBeam(scene, onComplete) {
    if (isShooterTimeOver) return;
    const chargeBall = scene.add.circle(bossEnemy.x, bossEnemy.y + 100, 10, 0xffffff).setDepth(260);
    chargeBall.setBlendMode(Phaser.BlendModes.ADD); 
    
    const chargeAura = scene.add.circle(bossEnemy.x, bossEnemy.y + 100, 20, 0x00ffff, 0.5).setDepth(259);
    chargeAura.setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
        targets: [chargeBall, chargeAura], 
        radius: 120, 
        duration: 1500, 
        ease: 'Cubic.easeInOut',
        onStart: () => { try { scene.sound.play('roar'); } catch(e){} }, 
        onComplete: () => {
            chargeBall.destroy();
            chargeAura.destroy();
            if (isShooterTimeOver) return;
            fireBeam(scene, bossEnemy.x, bossEnemy.y + 100, onComplete);
        }
    });
}

function fireBeam(scene, x, y, onComplete) {
    if (isShooterTimeOver) return;
    try { scene.sound.play('launch', { volume: 3.0 }); } catch(e) {} 
    
    const outerBeam = scene.add.rectangle(x, y, 220, 0, 0x00ffff, 0.4).setOrigin(0.5, 0).setDepth(250);
    outerBeam.setBlendMode(Phaser.BlendModes.ADD); 
    scene.physics.add.existing(outerBeam);

    const midBeam = scene.add.rectangle(x, y, 140, 0, 0x88ffff, 0.7).setOrigin(0.5, 0).setDepth(251);
    midBeam.setBlendMode(Phaser.BlendModes.ADD);

    const coreBeam = scene.add.rectangle(x, y, 60, 0, 0xffffff, 1.0).setOrigin(0.5, 0).setDepth(252);
    coreBeam.setBlendMode(Phaser.BlendModes.ADD);

    const energyLines = [];
    for (let i = 0; i < 15; i++) {
        const lineX = x + Phaser.Math.Between(-40, 40);
        const lineW = Phaser.Math.Between(1, 4); 
        const lineH = Phaser.Math.Between(100, 300);
        const line = scene.add.rectangle(lineX, y, lineW, lineH, 0xffffff, 0.9).setOrigin(0.5, 0).setDepth(253);
        line.setBlendMode(Phaser.BlendModes.ADD);
        
        const lineTween = scene.tweens.add({
            targets: line,
            y: y + 2500, 
            duration: Phaser.Math.Between(150, 350),
            repeat: -1,
            delay: Phaser.Math.Between(0, 200)
        });
        energyLines.push({ rect: line, tween: lineTween });
    }

    scene.tweens.add({
        targets: [outerBeam, midBeam, coreBeam], 
        height: 2500, 
        duration: 150, 
        ease: 'Power2',
        onComplete: () => {
            if (isShooterTimeOver) {
                outerBeam.destroy(); midBeam.destroy(); coreBeam.destroy();
                energyLines.forEach(item => { item.tween.remove(); item.rect.destroy(); });
                return;
            }
            scene.cameras.main.shake(800, 0.03);

            const checkHit = scene.time.addEvent({
                delay: 20, loop: true,
                callback: () => {
                    if (isShooterTimeOver) { checkHit.remove(); return; }
                    if (activeHero && activeHero.active && isShooterMode) {
                        if (Math.abs(activeHero.x - outerBeam.x) < 110) {
                            takeHeroShooterDamage(scene, 15); 
                        }
                    }
                }
            });

            scene.time.delayedCall(1000, () => {
                checkHit.remove();
                
                energyLines.forEach(item => {
                    item.tween.remove();
                    item.rect.destroy();
                });

                scene.tweens.add({
                    targets: [outerBeam, midBeam, coreBeam], 
                    width: 0, 
                    alpha: 0, 
                    duration: 300,
                    onComplete: () => {
                        outerBeam.destroy();
                        midBeam.destroy();
                        coreBeam.destroy();
                        if (!isShooterTimeOver && onComplete) onComplete();
                    }
                });
            });
        }
    });
}

function fireMissile(scene, x, y, onComplete) {
    if (isShooterTimeOver) return; 
    try { scene.sound.play('launch', { volume: 2.0 }); } catch(e) {} 
    
    const missile = scene.add.sprite(x, y, 'missile').setOrigin(0.5).setDepth(255);
    missile.setDisplaySize(90, 150); 
    scene.physics.add.existing(missile);
    
    let speed = 550; 
    let currentAngle = Math.PI / 2; 
    let trackingTimer = 0; 

    const trackEvent = scene.time.addEvent({
        delay: 20, loop: true,
        callback: () => {
            if (!missile || !missile.active || !isShooterMode || isShooterTimeOver) { 
                if (isShooterTimeOver && missile && missile.active) missile.destroy();
                trackEvent.remove(); 
                return; 
            }

            trackingTimer += 20; 

            if (trackingTimer <= 2000 && activeHero && activeHero.active) {
                const targetAngle = Phaser.Math.Angle.Between(missile.x, missile.y, activeHero.x, activeHero.y);
                let diff = Phaser.Math.Angle.Wrap(targetAngle - currentAngle);
                currentAngle += diff * 0.04; 
            }

            missile.rotation = currentAngle - Math.PI / 2; 
            missile.body.setVelocity(Math.cos(currentAngle) * speed, Math.sin(currentAngle) * speed);

            if (activeHero && activeHero.active) {
                const dist = Phaser.Math.Distance.Between(missile.x, missile.y, activeHero.x, activeHero.y);
                if (dist < 40) {
                    explodeMissile(scene, missile, trackEvent, onComplete);
                    takeHeroShooterDamage(scene, 200); 
                    return;
                }
            }

            if (missile.y > 0 || missile.y < -1350 || missile.x < 0 || missile.x > 720) {
                explodeMissile(scene, missile, trackEvent, onComplete);
            }
        }
    });
}

function explodeMissile(scene, missile, trackEvent, onComplete) {
    if (isShooterTimeOver || !missile || !missile.active) return;
    trackEvent.remove(); 
    const exX = missile.x;
    const exY = missile.y;
    missile.destroy(); 

    try { scene.sound.play('explode', { volume: 2.0 }); } catch(e) {}
    
    const flash = scene.add.circle(exX, exY, 120, 0xff8800).setDepth(260);
    scene.tweens.add({
        targets: flash, alpha: 0, scale: 2.5, duration: 300, ease: 'Power2',
        onComplete: () => flash.destroy()
    });

    fireCircleBullets(scene, exX, exY);
    if (onComplete) onComplete();
}

function fireCircleBullets(scene, x, y) {
    if (isShooterTimeOver) return; 
    try { scene.sound.play('shoot'); } catch(e) {}
    
    const numBullets = 32; 
    const speed = 400; 

    for (let i = 0; i < numBullets; i++) {
        const angle = (i * (360 / numBullets)) * (Math.PI / 180);
        const bullet = scene.add.sprite(x, y, 'enemy2').setOrigin(0.5).setDepth(255);
        bullet.setDisplaySize(40, 40); 
        scene.physics.add.existing(bullet);
        bullet.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        
        const checkEvent = scene.time.addEvent({
            delay: 20, loop: true,
            callback: () => {
                if (!bullet || !bullet.active || isShooterTimeOver) { 
                    if (isShooterTimeOver && bullet && bullet.active) bullet.destroy();
                    checkEvent.remove(); 
                    return; 
                }
                
                if (bullet.y < -1380 || bullet.y > 100 || bullet.x < -100 || bullet.x > 820) {
                    bullet.destroy();
                    checkEvent.remove();
                } else if (activeHero && activeHero.active) {
                    const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, activeHero.x, activeHero.y);
                    if (dist < 35) { 
                        bullet.destroy();
                        checkEvent.remove();
                        try { scene.sound.play('hero_hit'); } catch(e) {}
                        takeHeroShooterDamage(scene, 100); 
                    }
                }
            }
        });
    }
}

function takeHeroShooterDamage(scene, amount) {
    if (isShooterTimeOver) return; 
    globalHP -= amount;
    if (globalHP < 0) globalHP = 0;
    
    if (typeof heroShooterUI !== 'undefined' && heroShooterUI.length > 0) {
        if(heroShooterUI[1]) heroShooterUI[1].width = 660 * (globalHP / 1000);
        if(heroShooterUI[2]) heroShooterUI[2].setText(`HP: ${globalHP} / 1000`);
    }

    if (activeHero) {
        activeHero.setTint(0xff0000);
        scene.time.delayedCall(100, () => {
            if (activeHero && activeHero.active) activeHero.clearTint();
        });
    }

    if (globalHP <= 0 && isShooterMode) {
        isShooterMode = false;
        if (timerEvent) timerEvent.remove();
        scene.add.text(360, -640, 'GAME OVER', { 
            fontSize: '80px', fill: '#ff0000', fontStyle: 'bold', stroke: '#000', strokeThickness: 8 
        }).setOrigin(0.5).setDepth(1000);
        if (activeHero) activeHero.destroy();
    }
}

function startAutoShooting(scene, hero) {
    scene.time.addEvent({
        delay: 150, 
        loop: true,
        callback: () => {
            if (!isShooterMode || !hero || !hero.active || isShooterTimeOver) return; 
            
            const bullet = scene.add.sprite(hero.x, hero.y - 50, 'arrow').setOrigin(0.5).setDepth(255);
            bullet.setDisplaySize(40, 100); 
            scene.physics.add.existing(bullet);
            bullet.body.setVelocityY(-2000); 
            
            try { scene.sound.play('shoot'); } catch(e) {}
            
            const checkHitEvent = scene.time.addEvent({
                delay: 20, loop: true,
                callback: () => {
                    if (!bullet || !bullet.active || isShooterTimeOver) { 
                        if (isShooterTimeOver && bullet && bullet.active) bullet.destroy();
                        checkHitEvent.remove(); 
                        return; 
                    }
                    
                    if (bullet.y < -1380) { 
                        bullet.destroy();
                        checkHitEvent.remove();
                    } else if (bossEnemy && bossEnemy.active) {
                        if (bullet.x > bossEnemy.x - 120 && bullet.x < bossEnemy.x + 90 && bullet.y < bossEnemy.y + 100 && bullet.y > bossEnemy.y - 120) {
                            bullet.destroy();
                            checkHitEvent.remove();
                            try { scene.sound.play('hit'); } catch(e) {}
                            
                            bossEnemy.setTint(0xff8888);
                            scene.time.delayedCall(50, () => {
                                if (bossEnemy && bossEnemy.active) bossEnemy.clearTint();
                            });

                            bossHP -= 150; 
                            if (bossHP < 0) bossHP = 0;
                            if (typeof bossUI !== 'undefined' && bossUI.length > 1 && bossUI[1]) {
                                bossUI[1].width = 660 * (bossHP / bossMaxHP);
                            }
                            
                            if (bossHP <= 0 && isShooterMode) {
                                isShooterMode = false;
                                if (timerEvent) timerEvent.remove();
                                scene.add.text(360, -640, 'YOU WIN!', { 
                                    fontSize: '80px', fill: '#ffff00', fontStyle: 'bold', stroke: '#000', strokeThickness: 8 
                                }).setOrigin(0.5).setDepth(1000);
                                bossEnemy.destroy();
                            }
                        }
                    }
                }
            });
        }
    });
}
