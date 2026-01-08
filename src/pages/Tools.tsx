import { ExternalLink, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Tool {
    id: string;
    name: string;
    emoji?: string;
    image?: string;
    description: string;
    features: string[];
    url: string;
    ctaText: string;
    verified?: boolean;
    badge?: string;
}

const tools: Tool[] = [
    {
        id: 'nano-banana',
        name: 'Nano Banana Pro',
        emoji: '🍌',
        description: 'AI-powered insurance quoting and lead management platform designed for independent agents.',
        features: [
            'Instant multi-carrier quotes',
            'Automated lead follow-up',
            'Integrated CRM system',
            'Real-time commission tracking',
            'Advanced agent dashboard',
        ],
        url: 'https://nanobanana.com',
        ctaText: 'Explore Nano Banana Pro',
        verified: true,
        badge: 'Featured',
    },
];

export default function Tools() {
    return (
        <div className="container mx-auto px-4 py-8 animate-fade-in">
            {/* Page Header */}
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Wrench className="h-8 w-8 text-primary" />
                    Tools & Resources
                </h1>
                <p className="text-muted-foreground text-lg">
                    Powerful tools to streamline your workflow and grow your insurance business
                </p>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                ))}
            </div>
        </div>
    );
}

function ToolCard({ tool }: { tool: Tool }) {
    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            {/* Tool Image/Logo */}
            <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center rounded-t-xl overflow-hidden">
                {tool.image ? (
                    <img src={tool.image} alt={tool.name} className="max-h-32 object-contain" />
                ) : (
                    <span className="text-6xl animate-in zoom-in duration-500">{tool.emoji}</span>
                )}
                {tool.badge && (
                    <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground shadow-sm">{tool.badge}</Badge>
                )}
            </div>

            {/* Card Content */}
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    {tool.name}
                    {tool.verified && (
                        <Badge variant="secondary" className="text-xs font-normal">
                            Verified
                        </Badge>
                    )}
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                    {tool.description}
                </CardDescription>
            </CardHeader>

            <CardContent className="flex-grow">
                <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground/80">Key Features:</p>
                    <ul className="space-y-2">
                        {tool.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="text-primary mt-0.5 font-bold">✓</span>
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>

            {/* Card Footer */}
            <CardFooter className="pt-4 mt-auto">
                <Button
                    className="w-full shadow-sm hover:shadow-md transition-all"
                    onClick={() => window.open(tool.url, '_blank')}
                >
                    {tool.ctaText}
                    <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
