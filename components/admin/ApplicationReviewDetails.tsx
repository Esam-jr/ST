import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Star,
  Lightbulb,
  BarChart3,
  Users,
  Rocket,
  CheckCircle,
  XCircle,
} from "lucide-react";

type ReviewStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED"
  | "WITHDRAWN";

interface ApplicationReview {
  id: string;
  score: number | null;
  innovationScore: number | null;
  marketScore: number | null;
  teamScore: number | null;
  executionScore: number | null;
  feedback: string | null;
  status: ReviewStatus;
  assignedAt: string;
  completedAt: string | null;
  reviewer: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface Application {
  id: string;
  startupName: string;
  industry: string;
  stage: string;
  status: string;
  submittedAt: string;
  reviewsCompleted: number;
  reviewsTotal: number;
  reviews: ApplicationReview[];
  averageScores: {
    overall: number;
    innovation: number;
    market: number;
    team: number;
    execution: number;
  };
  rank: number;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface ApplicationReviewDetailsProps {
  application: Application;
}

const ApplicationReviewDetails: React.FC<ApplicationReviewDetailsProps> = ({
  application,
}) => {
  // Helper function to format dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status badge for review
  const getReviewStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-600">
            Pending
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-600">
            In Progress
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600">
            Completed
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600">
            Rejected
          </Badge>
        );
      case "WITHDRAWN":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-600">
            Withdrawn
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get score label and color based on score value
  const getScoreLabel = (score: number | null) => {
    if (score === null) return { label: "Not Rated", color: "text-gray-500" };

    if (score >= 80) return { label: "Excellent", color: "text-green-600" };
    if (score >= 70) return { label: "Good", color: "text-blue-600" };
    if (score >= 60) return { label: "Satisfactory", color: "text-yellow-600" };
    return { label: "Needs Improvement", color: "text-red-600" };
  };

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="reviews">
          Reviews ({application.reviewsCompleted}/{application.reviewsTotal})
        </TabsTrigger>
        <TabsTrigger value="entrepreneur">Entrepreneur</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Application Details</CardTitle>
              <CardDescription>
                Basic information about the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Startup Name
                  </dt>
                  <dd className="text-sm mt-1">{application.startupName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Industry
                  </dt>
                  <dd className="text-sm mt-1">{application.industry}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Stage
                  </dt>
                  <dd className="text-sm mt-1">{application.stage}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Submission Date
                  </dt>
                  <dd className="text-sm mt-1">
                    {formatDate(application.submittedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Application Rank
                  </dt>
                  <dd className="text-sm mt-1 font-medium">
                    #{application.rank}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Average Scores</CardTitle>
              <CardDescription>
                Aggregated scores from all completed reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium">Overall Score</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg font-bold mr-2">
                      {application.averageScores.overall || "N/A"}
                    </span>
                    {application.averageScores.overall && (
                      <span
                        className={`text-xs ${
                          getScoreLabel(application.averageScores.overall).color
                        }`}
                      >
                        {getScoreLabel(application.averageScores.overall).label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Lightbulb className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm">Innovation</span>
                  </div>
                  <span className="font-medium">
                    {application.averageScores.innovation || "N/A"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 text-purple-500 mr-2" />
                    <span className="text-sm">Market Potential</span>
                  </div>
                  <span className="font-medium">
                    {application.averageScores.market || "N/A"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Team</span>
                  </div>
                  <span className="font-medium">
                    {application.averageScores.team || "N/A"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Rocket className="h-4 w-4 text-orange-500 mr-2" />
                    <span className="text-sm">Execution</span>
                  </div>
                  <span className="font-medium">
                    {application.averageScores.execution || "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="reviews">
        {application.reviews.length === 0 ? (
          <div className="text-center py-8 border rounded-lg">
            <p className="text-muted-foreground">
              No reviews have been assigned yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {application.reviews.map((review) => (
              <Card key={review.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage
                          src={review.reviewer.image || undefined}
                          alt={review.reviewer.name || "Reviewer"}
                        />
                        <AvatarFallback>
                          {review.reviewer.name?.charAt(0) || "R"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">
                          {review.reviewer.name || "Anonymous Reviewer"}
                        </CardTitle>
                        <CardDescription>
                          {review.reviewer.email}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getReviewStatusBadge(review.status)}
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {review.status === "COMPLETED"
                          ? `Completed ${formatDate(review.completedAt)}`
                          : `Assigned ${formatDate(review.assignedAt)}`}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {review.status === "COMPLETED" ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <div className="flex flex-col items-center p-2 border rounded-md">
                          <Star className="h-5 w-5 text-yellow-500 mb-1" />
                          <span className="text-xs text-muted-foreground">
                            Overall
                          </span>
                          <span className="font-bold">
                            {review.score || "N/A"}
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-2 border rounded-md">
                          <Lightbulb className="h-5 w-5 text-blue-500 mb-1" />
                          <span className="text-xs text-muted-foreground">
                            Innovation
                          </span>
                          <span className="font-bold">
                            {review.innovationScore || "N/A"}
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-2 border rounded-md">
                          <BarChart3 className="h-5 w-5 text-purple-500 mb-1" />
                          <span className="text-xs text-muted-foreground">
                            Market
                          </span>
                          <span className="font-bold">
                            {review.marketScore || "N/A"}
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-2 border rounded-md">
                          <Users className="h-5 w-5 text-green-500 mb-1" />
                          <span className="text-xs text-muted-foreground">
                            Team
                          </span>
                          <span className="font-bold">
                            {review.teamScore || "N/A"}
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-2 border rounded-md">
                          <Rocket className="h-5 w-5 text-orange-500 mb-1" />
                          <span className="text-xs text-muted-foreground">
                            Execution
                          </span>
                          <span className="font-bold">
                            {review.executionScore || "N/A"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-1">Feedback</h4>
                        <div className="p-3 bg-muted rounded-md whitespace-pre-line">
                          {review.feedback || "No feedback provided."}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        This review is not completed yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="entrepreneur">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Entrepreneur Information
            </CardTitle>
            <CardDescription>
              Details about the entrepreneur who submitted this application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {application.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">
                  {application.user.name || "Unnamed User"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {application.user.email}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Application Status</h4>
              <div className="flex items-center gap-2">
                {application.status === "APPROVED" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : application.status === "REJECTED" ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <Clock className="h-5 w-5 text-blue-500" />
                )}
                <span className="capitalize">
                  {application.status.toLowerCase().replace("_", " ")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ApplicationReviewDetails;
