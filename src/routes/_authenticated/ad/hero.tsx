import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/ad/hero')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/ad/hero"!</div>
}
