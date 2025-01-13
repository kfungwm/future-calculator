'use client'
import React, { useState, useEffect } from 'react'

const Overview = () => {
  const [positionType, setPositionType] = useState<string>('long')
  const [entryPrice, setentryPrice] = useState<number | undefined>(undefined)
  const [exitPrice, setExitPrice] = useState<number | undefined>(undefined)
  const [quantity, setQuantity] = useState<number>(0)
  const [leverage, setLeverage] = useState<number>(15)
  const [tradingSize, setTradingSize] = useState<number | undefined>(undefined)
  const [liquidationPrice, setLiquidationPrice] = useState<number | null>(0)
  // const [countDeci, setCountDeci] = useState(2)
  // const [roiPercentage, setRoiPercentage] = useState(15)
  const [roi, setRoi] = useState<number>(0)
  const [pnl, setPnl] = useState<number>(0)

  const handleChange = (value: number) => {
    const newValue = Math.max(2, Math.min(100, Number(value)))
    setLeverage(newValue)
  }

  const longShortType = (type: string) => {
    setPositionType(type)
  }

  const calculateQuantity = () => {
    if (
      tradingSize !== undefined &&
      entryPrice !== undefined &&
      tradingSize > 0 &&
      entryPrice > 0
    ) {
      const totalQuantity = (tradingSize * leverage) / entryPrice
      setQuantity(totalQuantity)
    }
  }

  const getDecimalPlaces = (price: number): number => {
    if (price >= 1) return 2
    if (price >= 0.01) return 4
    return 8
  }

  const calculateLiquidationPrice = () => {
    const decimalPlaces = getDecimalPlaces(entryPrice ?? 0)

    if (
      entryPrice === undefined ||
      tradingSize === undefined ||
      leverage <= 1
    ) {
      setLiquidationPrice(null)
      return
    }

    const maintenanceMargin = 0.0 // 0.5% maintenance margin, adjust as needed
    // const positionSize = tradingSize * leverage

    if (positionType === 'long') {
      const liqPrice = (
        entryPrice *
        (1 - 1 / leverage + maintenanceMargin)
      ).toFixed(decimalPlaces)
      setLiquidationPrice(Number(liqPrice))
    } else {
      const liqPrice = (
        entryPrice *
        (1 + 1 / leverage - maintenanceMargin)
      ).toFixed(decimalPlaces)
      setLiquidationPrice(Number(liqPrice))
    }
  }

  const roiPercentages = [15, 25, 35]
  const roiPnl = (roiPercentage: number) => {
    if (entryPrice === undefined || tradingSize === undefined) {
      return { validRoi: '', validPnl: '' }
    }
    const margin = tradingSize
    const isLong = positionType === 'long'
    const investmentRoi = isLong
      ? entryPrice * (1 + roiPercentage / 100 / leverage) // Long
      : entryPrice * (1 - roiPercentage / 100 / leverage) // Short

    const investmentPnl = (roiPercentage / 100) * margin

    const decimalPlaces = getDecimalPlaces(entryPrice)

    const validRoi = isNaN(investmentRoi)
      ? ''
      : investmentRoi.toFixed(decimalPlaces)
    const validPnl = isNaN(investmentPnl)
      ? ''
      : investmentPnl.toFixed(decimalPlaces)

    return { validRoi, validPnl }
  }

  const calculateExitPrice = () => {
    if (
      entryPrice === undefined ||
      tradingSize === undefined ||
      exitPrice === undefined
    ) {
      return ''
    }

    const margin = tradingSize
    // const roiPer:number = 0
    // const pnlWithoutLeverage:number = 0
    const isLong = positionType === 'long'
    const roiPercentage = isLong
      ? ((exitPrice - entryPrice) / entryPrice) * 100 * leverage // Long
      : ((entryPrice - exitPrice) / entryPrice) * 100 * leverage // Short

    const decimalPlaces = getDecimalPlaces(entryPrice)

    const exitRoi = isNaN(roiPercentage) ? '' : roiPercentage.toFixed(2)
    const exitPnl = ((roiPercentage / 100) * margin).toFixed(decimalPlaces)
    // const exitPnl = isNaN(pnlAmount) ? '' : pnlAmount

    // if (positionType === 'long') {
    //   // Long berekening
    //   roiPer = ((exitPrice - entryPrice) / entryPrice) * 100 * leverage
    // } else if (positionType === 'short') {
    //   // Short berekening
    //   roiPer = ((entryPrice - exitPrice) / entryPrice) * 100 * leverage
    // }

    setRoi(Number(exitRoi))
    setPnl(Number(exitPnl))
  }
  // const handleExitChange = (event) => {
  //   const newExitValue = parseFloat(event.target.value)
  //   setExitPrice(newExitValue)
  //   calculateExitPrice(newExitValue) // Bereken ROI en PNL
  // }

  useEffect(() => {
    // roiPnl()
    calculateExitPrice()
    calculateQuantity()
    calculateLiquidationPrice()
  }, [
    leverage,
    quantity,
    entryPrice,
    exitPrice,
    tradingSize,
    positionType,
    roi,
    pnl,
  ])

  return (
    <div className="lg:px-10 lg:py-20  justify-center items-center text-center max-w-[1200px]">
      <div className="font-extrabold text-3xl mb-10">Futures Calculator</div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 border w-full sm:w-[400px] p-5 rounded-lg bg-[#202630]">
          <div className="w-full">
            <div className="space-y-5">
              <div className="flex w-full justify-between items-center border rounded-lg p-4 font-extrabold">
                <div className="whitespace-nowrap text-xs">Trading Size</div>
                <div className="w-full flex justify-end items-center">
                  <input
                    type="number"
                    min="0"
                    value={tradingSize || ''}
                    onChange={(e) => setTradingSize(Number(e.target.value))}
                    className="bg-transparent outline-none text-right appearance-none"
                    placeholder="0"
                  ></input>
                  <div className="ml-2">USD</div>
                </div>
              </div>

              <div className="flex justify-between text-center font-extrabold border rounded-lg">
                {/* <button
                  className={`w-full py-1  rounded-l-lg ${
                    positionType === 'long' ? 'bg-[#2ebd85] ' : ''
                  }`}
                  onClick={() => setPositionType('long')}
                >
                  Long
                </button>
                <button
                  className={`w-full py-1  rounded-r-lg ${
                    positionType === 'short' ? 'bg-[#f6465d] ' : ''
                  }`}
                  onClick={() => setPositionType('short')}
                >
                  Short
                </button> */}
                <button
                  className={`w-full py-1  rounded-l-lg ${
                    positionType === 'long' ? 'bg-[#2ebd85] ' : ''
                  }`}
                  onClick={() => longShortType('long')}
                >
                  Long
                </button>
                <button
                  className={`w-full py-1  rounded-r-lg ${
                    positionType === 'short' ? 'bg-[#f6465d] ' : ''
                  }`}
                  onClick={() => longShortType('short')}
                >
                  Short
                </button>
              </div>

              <div className="border rounded-lg w-full p-3 flex justify-between font-extrabold text-xl items-center">
                <button
                  className="cursor-pointer"
                  onClick={() => handleChange(leverage - 1)}
                >
                  -
                </button>
                <div className="flex mx-auto ">
                  <input
                    min=""
                    type="number"
                    value={leverage}
                    onChange={(e) => handleChange(Number(e.target.value))}
                    placeholder="10"
                    className="bg-transparent outline-none appearance-none text-right w-10"
                  ></input>
                  x
                </div>

                <button
                  className="cursor-pointer"
                  onClick={() => handleChange(leverage + 1)}
                >
                  +
                </button>
              </div>
              <div className="w-full">
                <section className="rangeWrap">
                  <input
                    className="w-full"
                    type="range"
                    value={leverage}
                    onChange={(e) => handleChange(Number(e.target.value))}
                    min=""
                    max="100"
                    step="1"
                    list="ticks"
                  />

                  <datalist
                    id="ticks"
                    className="flex justify-between w-full text-center items-center "
                  >
                    <option value="2" label="2x"></option>
                    <option value="20" label="20x"></option>
                    <option value="40" label="40x"></option>
                    <option value="60" label="60x"></option>
                    <option value="80" label="80x"></option>
                    <option value="100" label="100x"></option>
                  </datalist>
                </section>
              </div>

              <div className="flex w-full justify-between items-center border rounded-lg p-2 px-4 font-extrabold">
                <div className="whitespace-nowrap">Entry Price</div>
                <div className="w-full flex justify-end items-center">
                  <input
                    type="number"
                    min="0"
                    value={entryPrice || ''}
                    onChange={(e) => setentryPrice(Number(e.target.value))}
                    placeholder="0"
                    className="bg-transparent outline-none text-right appearance-none"
                  ></input>
                  <div className="ml-2">USD</div>
                </div>
              </div>

              <div className="flex w-full justify-between items-center border rounded-lg p-2 px-4 font-extrabold">
                <div className="whitespace-nowrap">Exit Price</div>
                <div className="w-full flex justify-end items-center">
                  <input
                    type="number"
                    min="0"
                    placeholder="Optional"
                    value={exitPrice || ''}
                    onChange={(e) => setExitPrice(Number(e.target.value))}
                    // onChange={handleExitChange}
                    className="bg-transparent outline-none text-right appearance-none"
                  ></input>
                  <div className="ml-2">USD</div>
                </div>
              </div>

              <div className="flex w-full justify-between items-center border rounded-lg p-2 px-4 font-extrabold">
                <div className="whitespace-nowrap">Quantity</div>
                <div className="w-full flex justify-end items-center">
                  <input
                    readOnly
                    type="number"
                    min="0"
                    value={quantity.toFixed(2) || ''}
                    // onChange={quantity}
                    placeholder=""
                    className="bg-transparent outline-none text-right appearance-none"
                  ></input>
                  <div className="ml-2">Tokens</div>
                </div>
              </div>
              {/* <div>
                <button className="w-full font-extrabold text-xl border border-[#f5d74c] rounded-lg p-4 bg-[#f5d74c] hover:bg-[#ddbd2a] text-slate-800 ">
                  Calculate
                </button>
              </div> */}
            </div>
          </div>
        </div>
        <div>
          <div className="md:h-[487.5px] border w-full sm:w-[400px] p-5 rounded-lg bg-[#202630] font-extrabold">
            <div className="w-full">
              <div className="space-y-5">
                <div className="flex">Result</div>
                <div className="flex justify-between">
                  <span>Liquidation Price:</span>
                  <span>{liquidationPrice || ''} USD</span>{' '}
                </div>
                {/* <hr className="w-[60%] mx-auto"></hr>
                <div className="flex justify-between">
                  <span>ROI (15%)</span>
                  <span>{roi || ''} ROI</span>{' '}
                </div>
                <div className="flex justify-between">
                  <span>PNL (15%)</span>
                  <span>{pnl || ''} PNL</span>{' '}
                </div> */}

                <div>
                  {roiPercentages.map((percentage) => {
                    const { validRoi, validPnl } = roiPnl(percentage) // Bereken ROI en PNL voor elk percentage

                    return (
                      <div key={percentage}>
                        <div className="space-y-3 items-center mb-3">
                          <hr className="w-[60%] mx-auto"></hr>
                          <div className="flex justify-between">
                            <span>ROI ({percentage}%)</span>
                            <span>{validRoi || ''} USD</span>
                          </div>
                          <div className="flex justify-between">
                            <span>PNL ({percentage}%)</span>
                            <span>{validPnl || ''} PNL</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {exitPrice ?? 0 > 0 ? (
                  <div className="space-y-3 items-center mb-3">
                    <hr className="w-[60%] mx-auto"></hr>
                    <div className="flex justify-between">
                      <span>ROI ({roi}%)</span>
                      <span>{exitPrice || ''} USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PNL ({roi}%)</span>
                      <span>{pnl || ''} PNL</span>
                    </div>
                  </div>
                ) : (
                  ''
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Overview
