import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, Trash2 } from "lucide-react";
import { Project } from "@/lib/store";
import Link from "next/link";

interface ProjectCardProps {
    project: Project;
    onDelete: (projectId: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    return (
        <Card className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-background/95">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg line-clamp-1">
                            {project.name}
                        </CardTitle>
                    </div>

                    <Button
                        onClick={() => onDelete(project.id)}
                        variant="destructive"
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
                <CardDescription className="line-clamp-2">
                    {project.metadata.title} by {project.metadata.author}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary" className="text-xs">
                        {project.metadata.language.toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(project.lastModified)}
                    </div>
                </div>
                <Link href={`/editor/${project.id}`}>
                    <Button className="w-full">Open Project</Button>
                </Link>
            </CardContent>
        </Card>
    );
}
