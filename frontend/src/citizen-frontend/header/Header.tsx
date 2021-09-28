// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useContext, useEffect, useState } from 'react'
import styled from 'styled-components'
import colors from 'lib-customizations/common'
import { desktopMin } from 'lib-components/breakpoints'
import CityLogo from './CityLogo'
import EvakaLogo from './EvakaLogo'
import DesktopNav from './DesktopNav'
import MobileNav from './MobileNav'
import { headerHeightDesktop, headerHeightMobile } from './const'
import { useUser } from '../auth'
import { MessageContext, MessagePageState } from '../messages/state'

export default React.memo(function Header() {
  const [showMenu, setShowMenu] = useState(false)
  const user = useUser()

  const { unreadMessagesCount, refreshUnreadMessagesCount } =
    useContext<MessagePageState>(MessageContext)

  useEffect(() => {
    if (user) refreshUnreadMessagesCount()
  }, [refreshUnreadMessagesCount, user])

  return (
    <HeaderContainer>
      <CityLogo />
      <EvakaLogo />
      <DesktopNav unreadMessagesCount={unreadMessagesCount ?? 0} />
      <MobileNav
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        unreadMessagesCount={unreadMessagesCount ?? 0}
      />
    </HeaderContainer>
  )
})

const HeaderContainer = styled.header`
  z-index: 9;
  color: ${colors.greyscale.white};
  background-color: ${colors.blues.primary};
  position: sticky;
  top: 0;
  display: grid;
  grid: minmax(60px, min-content) / repeat(3, minmax(100px, 1fr));
  height: ${headerHeightMobile};
  width: 100%;

  @media (min-width: ${desktopMin}) {
    grid: minmax(${headerHeightDesktop}, min-content) / max-content max-content auto;
    height: ${headerHeightDesktop};
  }
`
