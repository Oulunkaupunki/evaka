// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { Localization } from '~localization'
import Header from '~header/Header'
import Decisions from '~decisions/decisions-page/Decisions'
import DecisionResponseList from '~decisions/decision-response-page/DecisionResponseList'
import ApplicationEditor from '~applications/editor/ApplicationEditor'
import GlobalErrorDialog from '~overlay/Error'
import { OverlayContextProvider } from '~overlay/state'
import Applications from '~applications/Applications'
import ApplicationCreation from '~applications/ApplicationCreation'
import ApplicationReadView from '~applications/read-view/ApplicationReadView'
import GlobalInfoDialog from '~overlay/Info'
import MapView from '~map/MapView'
import { Authentication } from '~auth'
import requireAuth from '~auth/requireAuth'

export default function App() {
  return (
    <BrowserRouter basename="/citizen">
      <Authentication>
        <Localization>
          <OverlayContextProvider>
            <Header />
            <Switch>
              <main>
                <Route exact path="/map" component={MapView} />
                <Route
                  exact
                  path="/applications"
                  component={requireAuth(Applications)}
                />
                <Route
                  exact
                  path="/applications/new/:childId"
                  component={requireAuth(ApplicationCreation)}
                />
                <Route
                  exact
                  path="/applications/:applicationId"
                  component={requireAuth(ApplicationReadView)}
                />
                <Route
                  exact
                  path="/applications/:applicationId/edit"
                  component={requireAuth(ApplicationEditor)}
                />
                <Route
                  exact
                  path="/decisions"
                  component={requireAuth(Decisions)}
                />
                <Route
                  exact
                  path="/decisions/by-application/:applicationId"
                  component={requireAuth(DecisionResponseList)}
                />
                <Route path="/" component={RedirectToEnduser} />
              </main>
            </Switch>
            <GlobalInfoDialog />
            <GlobalErrorDialog />
          </OverlayContextProvider>
        </Localization>
      </Authentication>
    </BrowserRouter>
  )
}

function RedirectToEnduser() {
  window.location.href =
    window.location.host === 'localhost:9094' ? 'http://localhost:9091' : '/'
  return null
}
