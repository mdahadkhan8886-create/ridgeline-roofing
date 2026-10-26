import { createFileRoute } from '@tanstack/react-router'
import { Hero } from '#/components/sections/Hero'
import { Services } from '#/components/sections/Services'
import { Process } from '#/components/sections/Process'
import { Pricing } from '#/components/sections/Pricing'
import { Financing } from '#/components/sections/Financing'
import { ServiceArea } from '#/components/sections/ServiceArea'
import { Reviews } from '#/components/sections/Reviews'
import { Estimate } from '#/components/sections/Estimate'
import { Calculator } from '#/components/sections/Calculator'
import { Projects } from '#/components/sections/Projects'
import { Faq } from '#/components/sections/Faq'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <>
      <Hero />
      <Services />
      <Calculator />
      <Process />
      <Pricing />
      <Financing />
      <Projects />
      <ServiceArea />
      <Reviews />
      <Faq />
      <Estimate />
    </>
  )
}
