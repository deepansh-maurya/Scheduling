import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import TabHeader from "./_components/tab-header";
import { Separator } from "@/components/ui/separator";
import TabPanel from "./_components/tab-panel";
import useMeetingFilter from "@/hooks/use-meeting-filter";
import PageTitle from "@/components/PageTitle";
import { getUserMeetingsQueryFn } from "@/lib/api";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Loader } from "@/components/loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useState } from "react";
import { MeetingType } from "@/lib/types";

const Meetings = () => {
  const { period } = useMeetingFilter();
  const [meetingType, setMeetingtype] = useState<MeetingType>("EVENT_BOOKING");
  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ["userMeetings", period, meetingType],
    queryFn: () => getUserMeetingsQueryFn(period, meetingType)
  });

  const meetings = data?.meetings || [];

  return (
    <div className="flex flex-col !gap-3">
      <PageTitle title="Meetings" />

      <ErrorAlert isError={isError} error={error} />

      {isLoading || isError ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <Loader size="lg" color="black" />
        </div>
      ) : (
        <div className="w-full">
          <Tabs
            value={meetingType}
            onValueChange={(value) => {
              console.log(value);
              setMeetingtype(value as MeetingType);
            }}
          >
            <TabsList>
              <TabsTrigger value="EVENT_BOOKING">Events Meetings</TabsTrigger>

              <TabsTrigger value="CALENDAR_EVENT">
                Calendar Meetings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="EVENT_BOOKING">
              <Card
                className="p-0 shadow-[0_1px_6px_0_rgb(0_0_0_/_10%)]
        min-h-[220px] border border-[#D4E16F)] bg-white rounded-[8px]
        "
              >
                <CardContent className="p-0 pb-3">
                  <TabHeader />
                  <Separator className="border-[#D4E16F]" />
                  <TabPanel
                    isFetching={isFetching}
                    meetings={meetings}
                    period={period}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="CALENDAR_EVENT">
              <Card
                className="p-0 shadow-[0_1px_6px_0_rgb(0_0_0_/_10%)]
        min-h-[220px] border border-[#D4E16F)] bg-white rounded-[8px]
        "
              >
                <CardContent className="p-0 pb-3">
                  <TabHeader>
                    <Button className="bg-transparent hover:bg-transparent text-black ">
                      <RefreshCcw /> Sync Meetings
                    </Button>
                  </TabHeader>
                  <Separator className="border-[#D4E16F]" />
                  <TabPanel
                    isFetching={isFetching}
                    meetings={meetings}
                    period={period}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Meetings;
