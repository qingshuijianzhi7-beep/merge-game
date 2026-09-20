// ==========================================
// 後半：ボス戦（シューティングモード）の全処理
// ==========================================
var bossAttackCycle = 0; // ★攻撃のサイクル（0=ミサイル、1=ビーム）を管理

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
                    bossUI.forEach(ui => ui.destroy()); bossUI = [];

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
    bossAttackCycle = 0; // ★ここでサイクルをリセット
    
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
                                timerEvent = scene.time.addEvent({
                                    delay: 1000, loop: true,
                                    callback: () => {
                                        if (!isShooterMode) return;
                                        timeLeft--;
                                        if (timerTextUI) timerTextUI.setText(`ゲームオーバーまであと ${timeLeft}秒`);
                                        if (timeLeft <= 0) {
                                            isShooterMode = false;
                                            timerEvent.remove();
                                            scene.add.text(360, -640, 'GAME OVER', { fontSize: '80px', fill: '#ff0000', fontStyle: 'bold', stroke: '#000', strokeThickness: 8 }).setOrigin(0.5).setDepth(1000);
                                            if (activeHero) activeHero.destroy();
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
    executeTeleportAttack(scene, 0);
}

function executeTeleportAttack(scene, count) {
    if (!bossEnemy || !bossEnemy.active || !isShooterMode) return;

    const baseW = 500;
    const baseH = 500;

    // ★5回目は中央上に現れる
    if (count === 4) {
        try { scene.sound.play('warp_out', { volume: 3.0 }); } catch(e) {}
        scene.tweens.add({
            targets: bossEnemy, displayWidth: 0, displayHeight: baseH * 1.5, alpha: 0, duration: 300, ease: 'Expo.easeIn', 
            onComplete: () => {
                bossEnemy.x = 360; bossEnemy.y = -900; 
                scene.time.delayedCall(200, () => {
                    try { scene.sound.play('warp_in', { volume: 3.0 }); } catch(e) {}
                    scene.tweens.add({
                        targets: bossEnemy, displayWidth: baseW, displayHeight: baseH, alpha: 1, duration: 300, ease: 'Expo.easeOut', 
                        onComplete: () => {
                            
                            // ★ここでサイクル分岐！
                            if (bossAttackCycle === 0) {
                                // 1回目はミサイル攻撃
                                scene.time.delayedCall(500, () => {
                                    fireMissile(scene, bossEnemy.x, bossEnemy.y, () => {
                                        bossAttackCycle = 1; // 次はビーム
                                        scene.time.delayedCall(1000, () => executeTeleportAttack(scene, 0));
                                    });
                                });
                            } else {
                                // 2回目はビーム攻撃（真ん中→左→右）
                                executeBeamSequence(scene, 0, () => {
                                    bossAttackCycle = 0; // 次はミサイルに戻る
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

    // ★1〜4回目（通常のワープ＆円状攻撃）
    try { scene.sound.play('warp_out', { volume: 3.0 }); } catch(e) {}
    scene.tweens.add({
        targets: bossEnemy, displayWidth: 0, displayHeight: baseH * 1.5, alpha: 0, duration: 300, ease: 'Expo.easeIn', 
        onComplete: () => {
            bossEnemy.x = Phaser.Math.Between(150, 570);
            bossEnemy.y = Phaser.Math.Between(-1200, -450); 
            scene.time.delayedCall(200, () => { 
                try { scene.sound.play('warp_in', { volume: 3.0 }); } catch(e) {}
                scene.tweens.add({
                    targets: bossEnemy, displayWidth: baseW, displayHeight: baseH, alpha: 1, duration: 300, ease: 'Expo.easeOut', 
                    onComplete: () => {
                        fireCircleBullets(scene, bossEnemy.x, bossEnemy.y);
                        executeTeleportAttack(scene, count + 1);
                    }
                });
            });
        }
    });
}

// ==========================================
// ★ビーム攻撃シーケンス（真ん中→左→右）
// ==========================================
function executeBeamSequence(scene, step, onComplete) {
    if (!bossEnemy || !bossEnemy.active || !isShooterMode) return;

    if (step === 0) {
        // すでに真ん中にいるので、そのままタメてビーム
        chargeAndFireBeam(scene, () => {
            scene.time.delayedCall(1000, () => executeBeamSequence(scene, 1, onComplete));
        });
    } else {
        // 左または右へのワープ
        const targetX = (step === 1) ? 150 : 570;
        const targetY = -900;
        
        try { scene.sound.play('warp_out', { volume: 3.0 }); } catch(e) {}
        const baseW = 500, baseH = 500;
        scene.tweens.add({
            targets: bossEnemy, displayWidth: 0, displayHeight: baseH * 1.5, alpha: 0, duration: 300, ease: 'Expo.easeIn',
            onComplete: () => {
                bossEnemy.x = targetX; bossEnemy.y = targetY;
                scene.time.delayedCall(200, () => {
                    try { scene.sound.play('warp_in', { volume: 3.0 }); } catch(e) {}
                    scene.tweens.add({
                        targets: bossEnemy, displayWidth: baseW, displayHeight: baseH, alpha: 1, duration: 300, ease: 'Expo.easeOut',
                        onComplete: () => {
                            // ★円状画像付き（ばらまき）
                            fireCircleBullets(scene, bossEnemy.x, bossEnemy.y);
                            
                            // タメてビーム
                            chargeAndFireBeam(scene, () => {
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

// ==========================================
// ★ 超絶リアルな極太ビーム攻撃
// ==========================================
function chargeAndFireBeam(scene, onComplete) {
    // タメ演出の光
    const chargeBall = scene.add.circle(bossEnemy.x, bossEnemy.y + 100, 10, 0xffffff).setDepth(260);
    chargeBall.setBlendMode(Phaser.BlendModes.ADD); 
    
    // タメ演出のオーラ（水色）
    const chargeAura = scene.add.circle(bossEnemy.x, bossEnemy.y + 100, 20, 0x00ffff, 0.5).setDepth(259);
    chargeAura.setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
        targets: [chargeBall, chargeAura], 
        radius: 120, // 巨大化
        duration: 1500, 
        ease: 'Cubic.easeInOut',
        onStart: () => { try { scene.sound.play('roar'); } catch(e){} }, 
        onComplete: () => {
            chargeBall.destroy();
            chargeAura.destroy();
            fireBeam(scene, bossEnemy.x, bossEnemy.y + 100, onComplete);
        }
    });
}

function fireBeam(scene, x, y, onComplete) {
    try { scene.sound.play('launch', { volume: 3.0 }); } catch(e) {} 
    
    // 1. 外側のぼんやりした水色オーラ（幅広・半透明）
    const outerBeam = scene.add.rectangle(x, y, 220, 0, 0x00ffff, 0.4).setOrigin(0.5, 0).setDepth(250);
    outerBeam.setBlendMode(Phaser.BlendModes.ADD); // 光の加算合成で境界を曖昧に
    scene.physics.add.existing(outerBeam);

    // 2. 中間層の少し明るい水色
    const midBeam = scene.add.rectangle(x, y, 140, 0, 0x88ffff, 0.7).setOrigin(0.5, 0).setDepth(251);
    midBeam.setBlendMode(Phaser.BlendModes.ADD);

    // 3. 芯となる真っ白な極太レーザー
    const coreBeam = scene.add.rectangle(x, y, 60, 0, 0xffffff, 1.0).setOrigin(0.5, 0).setDepth(252);
    coreBeam.setBlendMode(Phaser.BlendModes.ADD);

    // 4. ビームの流れ（下に向かって激しく流れるパーティクル）
    const beamParticles = scene.add.particles(0, 0, 'star', {
        x: { min: x - 60, max: x + 60 },
        y: y,
        speedY: { min: 2000, max: 4500 }, // 猛スピードで下に流れる
        lifespan: 400,
        scale: { start: 1.5, end: 0.2 },
        alpha: { start: 0.8, end: 0 },
        tint: 0x00ffff, // 水色
        blendMode: 'ADD',
        emitting: true
    }).setDepth(253);

    // ビームをドカン！と一気に下まで伸ばす
    scene.tweens.add({
        targets: [outerBeam, midBeam, coreBeam], 
        height: 2500, // 画面下まで突き抜ける長さ
        duration: 150, // 一瞬で伸びる
        ease: 'Power2',
        onComplete: () => {
            // 画面が激しく揺れる
            scene.cameras.main.shake(800, 0.03);

            // ヒーローがビーム（外側の太い部分）に触れているか判定
            const checkHit = scene.time.addEvent({
                delay: 20, loop: true,
                callback: () => {
                    if (activeHero && activeHero.active && isShooterMode) {
                        // outerBeamの幅(220)の半分以内に入ったらダメージ
                        if (Math.abs(activeHero.x - outerBeam.x) < 110) {
                            takeHeroShooterDamage(scene, 15); // 連続ダメージ
                        }
                    }
                }
            });

            // 1秒間照射し続けてから、細くなって消える
            scene.time.delayedCall(1000, () => {
                checkHit.remove();
                beamParticles.stop(); // パーティクルを止める

                scene.tweens.add({
                    targets: [outerBeam, midBeam, coreBeam], 
                    width: 0, // シュッと細くなって消える
                    alpha: 0, 
                    duration: 300,
                    onComplete: () => {
                        outerBeam.destroy();
                        midBeam.destroy();
                        coreBeam.destroy();
                        scene.time.delayedCall(500, () => beamParticles.destroy());
                        if (onComplete) onComplete();
                    }
                });
            });
        }
    });
}

// ==========================================
// ★追尾ミサイル処理
// ==========================================
function fireMissile(scene, x, y, onComplete) {
    try { scene.sound.play('launch', { volume: 2.0 }); } catch(e) {} 
    
    const missile = scene.add.sprite(x, y, 'missile').setOrigin(0.5).setDepth(255);
    missile.setDisplaySize(90, 150); 
    scene.physics.add.existing(missile);
    
    let speed = 550; 
    let currentAngle = Math.PI / 2; // 下向き
    let trackingTimer = 0; 

    const trackEvent = scene.time.addEvent({
        delay: 20, loop: true,
        callback: () => {
            if (!missile.active || !isShooterMode) { trackEvent.remove(); return; }

            trackingTimer += 20; 

            // ★追尾時間を2秒（2000ミリ秒）に延長！
            if (trackingTimer <= 2000 && activeHero && activeHero.active) {
                const targetAngle = Phaser.Math.Angle.Between(missile.x, missile.y, activeHero.x, activeHero.y);
                let diff = Phaser.Math.Angle.Wrap(targetAngle - currentAngle);
                currentAngle += diff * 0.04; 
            }

            // ★画像が最初から下を向いているので、-90度（Math.PI / 2）して真っ直ぐ前を向かせる！
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
                if (!bullet.active) { checkEvent.remove(); return; }
                
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
    globalHP -= amount;
    if (globalHP < 0) globalHP = 0;
    
    if (heroShooterUI.length > 0) {
        heroShooterUI[1].width = 660 * (globalHP / 1000);
        heroShooterUI[2].setText(`HP: ${globalHP} / 1000`);
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
            if (!isShooterMode || !hero.active) return;
            
            const bullet = scene.add.sprite(hero.x, hero.y - 50, 'arrow').setOrigin(0.5).setDepth(255);
            bullet.setDisplaySize(40, 100); 
            scene.physics.add.existing(bullet);
            bullet.body.setVelocityY(-2000); 
            
            try { scene.sound.play('shoot'); } catch(e) {}
            
            const checkHitEvent = scene.time.addEvent({
                delay: 20, loop: true,
                callback: () => {
                    if (!bullet.active) { checkHitEvent.remove(); return; }
                    
                    if (bullet.y < -1380) { 
                        bullet.destroy();
                        checkHitEvent.remove();
                    } else if (bossEnemy && bossEnemy.active) {
                        if (bullet.x > bossEnemy.x - 120 && bullet.x < bossEnemy.x + 90 && bullet.y < bossEnemy.y + 100 && bullet.y > bossEnemy.y - 120) {
                            bullet.destroy();
                            checkHitEvent.remove();
                            try { scene.sound.play('hit'); } catch(e) {}
                            
                            bossEnemy.setTint(0xff8888);
                            scene.time.delayedCall(50, () => bossEnemy.clearTint());

                            bossHP -= 150; 
                            if (bossHP < 0) bossHP = 0;
                            bossUI[1].width = 660 * (bossHP / bossMaxHP);
                            
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
