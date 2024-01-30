declare interface HeroDemo {
    Init(self: void): void;
}

declare global {
    var HeroDemo: HeroDemo;
}

export {};
