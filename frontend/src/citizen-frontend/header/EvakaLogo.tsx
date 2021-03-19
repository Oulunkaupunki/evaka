// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import styled from 'styled-components'
import { desktopMin, desktopSmall } from 'lib-components/breakpoints'

export default React.memo(function Logo() {
  return (
    <Container>
      <svg
        width="1280"
        height="640"
        viewBox="0 0 1280 640"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="1280" height="640" fill="none" />
        <path
          d="M391.2 326.108H263.2C264.267 342.043 270.4 354.79 281.6 364.616C292.533 374.443 306.667 379.223 323.467 379.223C333.067 379.223 341.6 377.63 349.6 374.177C352.8 372.849 355.733 371.256 358.667 369.397C365.867 364.616 375.733 365.413 381.333 372.052L381.867 372.584C375.2 380.816 366.667 386.925 356.533 391.174C346.4 395.423 335.2 397.548 322.933 397.548C307.2 397.548 293.333 394.095 281.067 387.456C269.067 380.816 259.467 371.521 252.8 359.836C245.867 347.885 242.4 334.607 242.4 319.734C242.4 304.862 245.6 291.584 252.267 279.633C258.933 267.682 267.733 258.652 278.933 252.013C290.4 245.374 302.933 242.187 317.067 242.187C331.2 242.187 344 245.374 355.2 252.013C366.4 258.652 375.2 267.682 381.6 279.367C388 291.052 391.2 304.331 391.2 319.469V326.108ZM280.267 274.056C270.4 283.351 264.533 295.567 263.2 310.705H371.733C370.4 295.567 364.8 283.351 354.667 274.056C344.8 264.761 332.267 259.98 317.333 259.98C302.4 259.98 290.133 264.761 280.267 274.056Z"
          fill="#FFFFFF"
        />
        <path
          d="M566.133 242.187L492.8 395.157H471.733L408.267 262.636C403.733 253.075 410.667 242.187 421.333 242.187L482.667 368.6L544.533 241.921L566.133 242.187Z"
          fill="#FFFFFF"
        />
        <path
          d="M689.867 257.856C700.533 267.682 705.6 282.289 705.6 301.675V395.157C694.667 395.157 686.133 386.393 686.133 375.77V371.787C681.6 379.754 674.667 385.862 665.867 390.111C657.067 394.626 646.4 396.751 634.133 396.751C617.333 396.751 603.733 392.767 593.867 384.8C584 376.833 578.933 366.21 578.933 352.931C578.933 340.184 583.467 329.826 592.8 321.859C602.133 313.892 617.067 310.174 637.333 310.174H685.333V300.879C685.333 287.866 681.6 278.039 674.4 271.134C667.2 264.23 656.533 261.043 642.4 261.043C632.8 261.043 623.467 262.636 614.667 265.823C605.867 269.01 598.133 273.259 592 278.836L582.667 263.698C590.4 257.325 599.467 252.279 610.4 248.561C621.067 245.108 632.533 243.249 644.267 243.249C664 242.984 679.2 248.03 689.867 257.856ZM666.933 372.584C675.2 367.272 681.333 359.836 685.333 349.744V325.046H637.867C612 325.046 598.933 334.075 598.933 352.134C598.933 360.898 602.4 367.803 609.067 372.849C615.733 377.895 625.067 380.551 637.333 380.551C648.533 380.551 658.667 377.895 666.933 372.584Z"
          fill="#FFFFFF"
        />
        <path
          d="M811.2 323.452L768 368.866V396.485H747.467V243.249V240.593C758.667 240.593 768 252.544 768 263.698V340.715L861.333 243.249H886.667L825.6 308.846L889.867 396.485H864.8L811.2 323.452Z"
          fill="#FFFFFF"
        />
        <path
          d="M1018.4 258.387C1029.07 268.213 1034.13 282.82 1034.13 302.207V395.689C1023.2 395.689 1014.67 386.925 1014.67 376.302V372.318C1010.13 380.285 1003.2 386.393 994.4 390.643C985.6 395.157 974.933 397.282 962.667 397.282C945.867 397.282 932.267 393.298 922.4 385.331C912.533 377.364 907.467 366.741 907.467 353.462C907.467 340.715 912 330.357 921.333 322.39C930.667 314.423 945.6 310.705 965.867 310.705H1013.87V301.41C1013.87 288.397 1010.13 278.57 1002.93 271.666C995.733 264.761 985.067 261.574 970.933 261.574C961.333 261.574 952 263.167 943.2 266.354C934.4 269.541 926.667 273.79 920.533 279.367L911.2 264.23C918.933 257.325 928 252.279 938.667 248.826C949.333 245.374 960.8 243.515 972.533 243.515C992.533 243.515 1007.73 248.561 1018.4 258.387ZM995.2 373.115C1003.47 367.803 1009.6 360.367 1013.6 350.275V325.577H966.133C940.267 325.577 927.2 334.607 927.2 352.666C927.2 361.43 930.667 368.334 937.333 373.38C944 378.426 953.333 381.082 965.6 381.082C977.067 380.816 986.933 378.426 995.2 373.115Z"
          fill="#FFFFFF"
        />
      </svg>
    </Container>
  )
})

const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;

  svg {
    max-width: 150px;
    width: auto;
    height: 100%;
  }

  @media (min-width: ${desktopMin}) and (max-width: calc(${desktopSmall} - 1px)) {
    svg {
      display: none;
    }
  }
`
