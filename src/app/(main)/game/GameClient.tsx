'use client';
import { useEffect, useState } from 'react';
import * as Phaser from 'phaser';

export default function GamePage() {
  const [gameInstance, setGameInstance] = useState<Phaser.Game | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    class FlappyGame extends Phaser.Scene {
      bird!: Phaser.Physics.Arcade.Sprite;
      pipes!: Phaser.Physics.Arcade.Group;
      score = 0;
      scoreText!: Phaser.GameObjects.Text;
      pipeTimer!: Phaser.Time.TimerEvent;
      cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

      flapSound!: Phaser.Sound.BaseSound;
      dieSound!: Phaser.Sound.BaseSound;
      hitSound!: Phaser.Sound.BaseSound;   
      pointSound!: Phaser.Sound.BaseSound; 

      constructor() {
        super('FlappyGame');
      }

      preload() {
        this.load.image('background', '/assets/background.png');
        this.load.image('pipe', '/assets/pipe.png');
        this.load.spritesheet('bird', '/assets/bird.png', {
          frameWidth: 34,
          frameHeight: 24,
        });

        this.load.audio('flap', '/sounds/flap.mp3');
        this.load.audio('die', '/sounds/die.mp3');

        this.load.audio('hit', '/sounds/hit.mp3');
        this.load.audio('point', '/sounds/point.mp3');
      }

      create() {
        const bg = this.add.image(0, 0, 'background')
          .setOrigin(0, 0)
          .setDisplaySize(this.scale.width, this.scale.height);

        this.anims.create({
          key: 'fly',
          frames: this.anims.generateFrameNumbers('bird', { start: 0, end: 2 }),
          frameRate: 10,
          repeat: -1
        });

        this.bird = this.physics.add.sprite(100, 300, 'bird')
          .setScale(2)
          .play('fly');
        this.bird.setCollideWorldBounds(true);

        const body = this.bird.body as Phaser.Physics.Arcade.Body;
        body.setGravityY(1200);
        body.setSize(30, 20).setOffset(2, 2);

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.input.on('pointerdown', () => this.flap());
        this.input.keyboard!.on('keydown-SPACE', () => this.flap());

        this.pipes = this.physics.add.group();
        this.pipeTimer = this.time.addEvent({
          delay: 1500,
          callback: this.spawnPipes,
          callbackScope: this,
          loop: true,
        });

        this.scoreText = this.add.text(20, 20, 'Score: 0', {
          fontSize: '32px',
          color: '#FFF',
          stroke: '#000',
          strokeThickness: 4
        }).setDepth(1);

        this.physics.add.collider(this.bird, this.pipes, () => this.gameOver(), undefined, this);

        this.flapSound = this.sound.add('flap');
        this.dieSound = this.sound.add('die');
        this.hitSound = this.sound.add('hit');   
        this.pointSound = this.sound.add('point');
      }

      flap() {
        if (this.bird.active) {
          this.bird.setVelocityY(-400);
          this.flapSound.play();
          this.tweens.add({
            targets: this.bird,
            angle: -20,
            duration: 100,
            yoyo: true
          });
        }
      }

      spawnPipes() {
        const gap = 200;
        const pipeY = Phaser.Math.Between(100, this.scale.height - gap - 100);

        const topPipe = this.pipes.create(this.scale.width, pipeY, 'pipe')
          .setOrigin(1, 1)
          .setFlipY(true);
        topPipe.body.setVelocityX(-200).setImmovable(true);

        const bottomPipe = this.pipes.create(this.scale.width, pipeY + gap, 'pipe')
          .setOrigin(1, 0);
        bottomPipe.body.setVelocityX(-200).setImmovable(true);

        const scoreZone = this.add.zone(topPipe.x, 0, 1, this.scale.height);
        this.physics.add.existing(scoreZone);
        (scoreZone.body as Phaser.Physics.Arcade.Body)
          .setVelocityX(-200)
          .setAllowGravity(false);

        this.physics.add.overlap(this.bird, scoreZone, () => {
          this.score += 1;
          this.scoreText.setText(`Score: ${this.score}`);
          setScore(this.score);

          this.pointSound.play(); 

          scoreZone.destroy();
        });
      }

      gameOver() {
        if (!this.bird.active) return;

        this.hitSound.play();
        this.dieSound.play();
        this.physics.pause();
        this.bird.setTint(0xff0000).setActive(false);
        this.pipeTimer.remove();
        this.cameras.main.shake(300, 0.01);

        this.add.text(this.scale.width / 2, 200, 'Game Over', {
          fontSize: '48px',
          color: '#ff0000',
          stroke: '#000',
          strokeThickness: 4
        }).setOrigin(0.5);

        const retryButton = this.add.text(this.scale.width / 2, 300, 'Retry', {
          fontSize: '32px',
          color: '#FFF',
          backgroundColor: '#000',
          padding: { x: 20, y: 10 },
          stroke: '#FFF',
          strokeThickness: 2
        })
          .setOrigin(0.5)
          .setInteractive()
          .on('pointerdown', () => {
            this.scene.restart();
            setGameOver(false);
            setScore(0);
          })
          .on('pointerover', () => retryButton.setAlpha(0.8))
          .on('pointerout', () => retryButton.setAlpha(1));

        setGameOver(true);
      }

      update() {
        if (this.bird.y > this.scale.height - 50) {
          this.gameOver();
        }
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'game-container',
      width: 480,
      height: 640,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0, x: 0 },
          debug: false
        }
      },
      scene: FlappyGame,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    const game = new Phaser.Game(config);
    setGameInstance(game);

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div id="game-container" className="w-full h-full" />
    </div>
  );
}
