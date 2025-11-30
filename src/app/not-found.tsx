"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, ArrowRight, Search } from "lucide-react";

// Simulated block data for the blockchain animation
const mockBlocks = [
    { number: "404", hash: "0x000000" },
    { number: "???", hash: "0x??????" },
    { number: "???", hash: "0x??????" },
    { number: "???", hash: "0x??????" },
];

export default function NotFound() {
    const [activeBlock, setActiveBlock] = useState(0);

    // Animate through blocks
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveBlock((prev) => (prev + 1) % mockBlocks.length);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
            {/* Background gradient effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
            </div>

            {/* Grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                           linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }}
            />

            {/* Main content */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
                {/* Logo */}
                <div className="mb-8">
                    <Image
                        src="/selendra-logo.png"
                        alt="Selendra"
                        width={64}
                        height={64}
                        className="opacity-80"
                    />
                </div>

                {/* 404 Display with blockchain concept */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium mb-6">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        BLOCK NOT FOUND
                    </div>

                    <h1 className="text-[120px] md:text-[180px] font-black leading-none tracking-tighter text-foreground mb-4">
                        404
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
                        This block doesn&apos;t exist in our chain. The page you&apos;re looking for may have been moved or never existed.
                    </p>
                </div>

                {/* Blockchain visualization */}
                <div className="w-full max-w-2xl mx-auto mb-12">
                    <div className="flex items-center justify-center gap-2 overflow-hidden py-4">
                        {mockBlocks.map((block, index) => (
                            <div key={index} className="flex items-center">
                                {/* Block */}
                                <div
                                    className={`
                    relative w-20 h-20 md:w-24 md:h-24 rounded-lg border-2 
                    flex flex-col items-center justify-center
                    transition-all duration-500
                    ${index === 0
                                            ? "border-red-500/50 bg-red-500/10 text-red-500"
                                            : index === activeBlock
                                                ? "border-primary/50 bg-primary/10 text-primary scale-110"
                                                : "border-border/50 bg-card/50 text-muted-foreground"
                                        }
                  `}
                                >
                                    <span className="text-[10px] font-medium opacity-60">BLOCK</span>
                                    <span className="text-lg md:text-xl font-bold font-mono">
                                        {block.number}
                                    </span>
                                    <span className="text-[8px] font-mono opacity-40 truncate w-16 text-center">
                                        {block.hash}
                                    </span>

                                    {/* Broken chain indicator for 404 block */}
                                    {index === 0 && (
                                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs">✕</span>
                                        </div>
                                    )}
                                </div>

                                {/* Chain connector */}
                                {index < mockBlocks.length - 1 && (
                                    <div className="flex items-center mx-1">
                                        <div
                                            className={`
                        w-4 md:w-8 h-0.5 
                        ${index === 0
                                                    ? "bg-red-500/30 border-t border-dashed border-red-500/50"
                                                    : "bg-primary/30"
                                                }
                      `}
                                            style={index === 0 ? { backgroundImage: 'none' } : {}}
                                        />
                                        <div className={`w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent ${index === 0 ? "border-l-red-500/30" : "border-l-primary/30"}`} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Chain status */}
                    <div className="text-center mt-4">
                        <p className="text-xs text-muted-foreground font-mono">
                            ··· Chain broken at block #404 ···
                        </p>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Link
                        href="/"
                        className="group inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg font-medium transition-all hover:opacity-90"
                    >
                        <Home className="w-4 h-4" />
                        Back to Explorer
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>

                    <Link
                        href="/blocks"
                        className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                    >
                        <Search className="w-4 h-4" />
                        Search Blocks
                    </Link>
                </div>
            </div>

            {/* Bottom decoration - animated block ticker like selendra.org */}
            <div className="relative z-10 border-t border-border/50 bg-card/30 backdrop-blur-sm py-3 overflow-hidden">
                <div className="flex items-center justify-center gap-8 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="font-medium">MAINNET</span>
                    </div>
                    <div className="hidden sm:block h-4 w-px bg-border" />
                    <div className="hidden sm:flex items-center gap-2">
                        <span className="opacity-60">1.0s</span>
                        <span>Block Time</span>
                    </div>
                    <div className="hidden md:block h-4 w-px bg-border" />
                    <div className="hidden md:flex items-center gap-4 font-mono">
                        {[8452922, 8452923, 8452924].map((num, i) => (
                            <span key={num} className={`${i === 2 ? "text-primary" : "opacity-60"}`}>
                                #{num.toLocaleString()}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
