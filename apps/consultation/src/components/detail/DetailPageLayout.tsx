import { Vote } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type DetailPageLayoutProps = {
  header: ReactNode
  details: ReactNode
  sidebar: ReactNode
  resultsContent: ReactNode
  votingContent: ReactNode
}

export function DetailPageLayout({
  header,
  details,
  sidebar,
  resultsContent,
  votingContent
}: DetailPageLayoutProps) {
  return (
    <div>
      {/* Desktop layout */}
      <div className="hidden lg:grid lg:grid-cols-8 lg:gap-12">
        {/* Left column - Header + Content */}
        <div className="lg:col-span-5 space-y-8">
          {header}
          {details}
        </div>

        {/* Right column - Sticky sidebar with independent scroll */}
        <div className="lg:col-span-3 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
          {sidebar}
        </div>
      </div>

      {/* Mobile layout with tabs */}
      <div className="min-w-0 lg:hidden">
        <div className="min-w-0 space-y-8">
          {header}

          <Tabs defaultValue="details" className="min-w-0">
            <TabsList className="w-full">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="min-w-0">
              <div className="min-w-0 space-y-8 pt-4">{details}</div>
            </TabsContent>
            <TabsContent value="results" className="min-w-0">
              <div className="min-w-0 space-y-6 pt-4">{resultsContent}</div>
            </TabsContent>
          </Tabs>

          {/* spacer so FAB doesn't overlap content */}
          <div className="h-20" />
        </div>

        {/* Drawer for voting only */}
        <Drawer>
          <DrawerTrigger asChild>
            <Button
              size="icon"
              className="fixed right-4 bottom-4 size-14 rounded-full shadow-lg sm:right-6 sm:bottom-6"
            >
              <Vote className="size-6" />
              <span className="sr-only">Open voting panel</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[80vh]">
            <div className="min-w-0 overflow-y-auto p-6">{votingContent}</div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}
