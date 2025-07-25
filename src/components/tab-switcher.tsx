"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EyeIcon, CodeIcon, CrownIcon } from "lucide-react";
import { FragmentWeb } from "@/modules/projects/ui/components/fragment-web";
import { FileExplorer } from "./file-explorer";
import { Fragment } from "@/generated/prisma";
import { useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { UserControl } from "./user-control";
import { useAuth } from "@clerk/nextjs";

interface Props {
  activeFragment: Fragment | null;
}

export const TabsSwitcher = ({ activeFragment }: Props) => {
  const [tabState, setTabState] = useState<"preview" | "code">("preview");
  const { has } = useAuth();
  const hasProAccess = has?.({ plan: "pro" });

  return (
    <Tabs className="h-full gap-y-0" value={tabState} onValueChange={(val) => setTabState(val as "preview" | "code")}>
      <div className="w-full flex items-center p-2 border-b gap-x-2">
        <TabsList className="border rounded-md px-1 py-0 flex items-center gap-2">
          <TabsTrigger value="preview" className="rounded-md px-2 py-1 flex items-center gap-1">
            <EyeIcon className="w-4 h-4" />
            <span>Demo</span>
          </TabsTrigger>
          <TabsTrigger value="code" className="rounded-md px-2 py-1 flex items-center gap-1">
            <CodeIcon className="w-4 h-4" />
            <span>Code</span>
          </TabsTrigger>
        </TabsList>

        <div className="ml-auto flex items-center gap-x-2">
          {!hasProAccess && (
            <Button asChild size="sm" >
              <Link href="/pricing">
                <CrownIcon className="w-4 h-4 mr-1" />
                Upgrade
              </Link>
            </Button>
          )}
          <UserControl />
        </div>
      </div>

      <TabsContent value="preview">
        {!!activeFragment && <FragmentWeb data={activeFragment} />}
      </TabsContent>
      <TabsContent value="code" className="min-h-0">
        {!!activeFragment?.files && (
          <FileExplorer files={activeFragment.files as { [path: string]: string }} />
        )}
      </TabsContent>
    </Tabs>
  );
};
