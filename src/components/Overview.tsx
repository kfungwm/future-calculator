'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { SunIcon, MoonIcon, ArrowPathIcon } from '@heroicons/react/24/solid'

const Overview = () => {
  const [positionType, setPositionType] = useState(() => {
    return localStorage.getItem('positionType') || 'long'
  })

  const [entryPrice, setentryPrice] = useState(() => {
    const storedValue = localStorage.getItem('entryPrice')
    return storedValue ? Number(storedValue) : undefined
  })

  const [exitPrice, setExitPrice] = useState(() => {
    const storedValue = localStorage.getItem('exitPrice')
    return storedValue ? Number(storedValue) : undefined
  })

  const [quantity, setQuantity] = useState(() => {
    const storedQuantity = localStorage.getItem('quantity')
    return storedQuantity ? Number(storedQuantity) : 0
  })

  const [leverage, setLeverage] = useState(() => {
    const storedLeverage = localStorage.getItem('leverage')
    return storedLeverage ? Number(storedLeverage) : 15
  })

  const [tradingSize, setTradingSize] = useState(() => {
    const storedValue = localStorage.getItem('tradingSize')
    return storedValue ? Number(storedValue) : undefined
  })

  const [liquidationPrice, setLiquidationPrice] = useState<number | null>(0)
  const [roi, setRoi] = useState<number>(0)
  const [pnl, setPnl] = useState<number>(0)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)
  const [optionTrading, setOptionTrading] = useState(() => {
    return localStorage.getItem('optionTrading') || 'trading'
  })

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode)
  }

  const handleChange = (value: number) => {
    const newValue = Math.max(2, Math.min(100, Number(value)))
    setLeverage(newValue)
  }

  const longShortType = (type: string) => {
    setPositionType(type)
  }

  const tradingToken = (type: string) => {
    resetValue()

    setOptionTrading(type)
  }

  // const calculateQuantity = () => {
  //   if (
  //     //  quantity !== undefined &&
  //     tradingSize !== undefined &&
  //     entryPrice !== undefined &&
  //     tradingSize > 0 &&
  //     entryPrice > 0
  //   )
  //     if (optionTrading === 'trading') {
  //       const totalQuantity = (tradingSize * leverage) / entryPrice
  //       setQuantity(totalQuantity)
  //       console.log('inside quan')
  //     } else {
  //       const totalTradingSize = (quantity / leverage) * entryPrice
  //       setTradingSize(totalTradingSize)
  //       console.log('hello trading', totalTradingSize)
  //       console.log('hello tradingSize', tradingSize)
  //     }
  // }
  const calculateQuantity = useCallback(() => {
    if (entryPrice !== undefined && entryPrice > 0) {
      if (
        optionTrading === 'trading' &&
        tradingSize !== undefined &&
        tradingSize >= 0
      ) {
        const totalQuantity = (tradingSize * leverage) / entryPrice
        setQuantity(totalQuantity)
      } else if (optionTrading === 'coin' && quantity > 0) {
        const totalTradingSize = (quantity / leverage) * entryPrice
        setTradingSize(totalTradingSize)
      }
    }
  }, [entryPrice, optionTrading, tradingSize, leverage, quantity])

  const getDecimalPlaces = (price: number): number => {
    if (price >= 1) return 2
    if (price >= 0.01) return 4
    return 8
  }

  const calculateLiquidationPrice = useCallback(() => {
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
  }, [entryPrice, tradingSize, leverage, positionType])

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

  const calculateExitPrice = useCallback(() => {
    if (
      entryPrice === undefined ||
      tradingSize === undefined ||
      exitPrice === undefined
    ) {
      return ''
    }

    const margin = tradingSize
    const isLong = positionType === 'long'

    const roiPercentage = isLong
      ? ((exitPrice - entryPrice) / entryPrice) * 100 * leverage // Long
      : ((entryPrice - exitPrice) / entryPrice) * 100 * leverage // Short

    const decimalPlaces = getDecimalPlaces(entryPrice)

    const exitRoi = isNaN(roiPercentage) ? '' : roiPercentage.toFixed(2)
    const exitPnl = ((roiPercentage / 100) * margin).toFixed(decimalPlaces)

    setRoi(Number(exitRoi))
    setPnl(Number(exitPnl))
  }, [entryPrice, tradingSize, exitPrice, leverage, positionType])

  const resetValue = () => {
    setTradingSize(undefined)
    setPositionType('long')
    setLeverage(15)
    setentryPrice(undefined)
    setExitPrice(undefined)
    setQuantity(0)
    setOptionTrading('trading')

    localStorage.removeItem('optionTrading')
    localStorage.removeItem('entryPrice')
    localStorage.removeItem('exitPrice')
    localStorage.removeItem('tradingSize')
    localStorage.removeItem('positionType')
    localStorage.removeItem('quantity')
    localStorage.removeItem('leverage')
  }

  useEffect(() => {
    calculateExitPrice()
    calculateQuantity()
    calculateLiquidationPrice()
  }, [
    calculateExitPrice,
    calculateQuantity,
    calculateLiquidationPrice,
    leverage,
    quantity,
    entryPrice,
    exitPrice,
    tradingSize,
    positionType,
    roi,
    pnl,
    optionTrading,
  ])

  useEffect(() => {
    localStorage.setItem('optionTrading', optionTrading)
    if (entryPrice !== undefined) {
      localStorage.setItem('entryPrice', entryPrice.toString())
    }
    if (exitPrice !== undefined) {
      localStorage.setItem('exitPrice', exitPrice.toString())
    }
    if (tradingSize !== undefined) {
      localStorage.setItem('tradingSize', tradingSize.toString())
    }
    localStorage.setItem('positionType', positionType)
    localStorage.setItem('quantity', quantity.toString())
    localStorage.setItem('leverage', leverage.toString())
  }, [
    optionTrading,
    entryPrice,
    exitPrice,
    tradingSize,
    positionType,
    quantity,
    leverage,
  ])

  useEffect(() => {
    const systemTheme = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches

    const savedMode = localStorage.getItem('theme')
    if (savedMode === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    } else if (savedMode === 'light') {
      setIsDarkMode(false)
      document.documentElement.classList.remove('dark')
    } else {
      setIsDarkMode(systemTheme)
      document.documentElement.classList.toggle('dark', systemTheme)
    }
  }, [])

  useEffect(() => {
    if (isDarkMode) {
      localStorage.setItem('theme', 'dark')
      document.documentElement.classList.add('dark')
    } else {
      localStorage.setItem('theme', 'light')
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  return (
    <div className="my-4 lg:px-10 lg:py-20  justify-center items-center text-center max-w-[1200px]">
      <div className="w-full flex justify-end my-4">
        <button onClick={toggleTheme}>
          {isDarkMode ? <SunIcon width={20} /> : <MoonIcon width={20} />}
        </button>
      </div>

      <div className="font-extrabold text-3xl mb-10">Futures Calculator</div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 border border-slate-400 dark:border-white w-full sm:w-[400px] p-5 rounded-lg bg-gray-100 dark:bg-[#202630] text-gray-900 dark:text-gray-100 shadow-xl">
          <div className="w-full">
            {/* <div className="relative flex justify-end mb-2">
              <button onClick={() => resetValue()}>
                <ArrowPathIcon width={20} />
              </button>
            </div>{' '} */}
            <div className="space-y-5">
              <div className="flex justify-between text-center font-extrabold border border-slate-400 dark:border-white rounded-lg">
                <button
                  className={`w-full py-1  rounded-l-lg ${
                    optionTrading === 'trading'
                      ? 'bg-slate-300 dark:bg-slate-500 '
                      : ''
                  }`}
                  onClick={() => tradingToken('trading')}
                >
                  Trading Size
                </button>
                <button
                  className={`w-full py-1  rounded-r-lg ${
                    optionTrading === 'coin'
                      ? 'bg-slate-300 dark:bg-slate-500 '
                      : ''
                  }`}
                  onClick={() => tradingToken('coin')}
                >
                  Coin Token
                </button>
              </div>{' '}
              {optionTrading === 'trading' ? (
                <div className="flex w-full justify-between items-center border border-slate-400 dark:border-white rounded-lg p-4 font-extrabold space-y-0">
                  <div className="whitespace-nowrap text-xs">Trading Size</div>
                  <div className="w-full flex justify-end items-center">
                    <input
                      type="number"
                      min="0"
                      value={tradingSize || ''}
                      onChange={(e) => setTradingSize(Number(e.target.value))}
                      className="bg-transparent outline-none text-right appearance-none w-32 sm:w-full"
                      placeholder="0"
                    ></input>
                    <div className="ml-2">USD</div>
                  </div>
                </div>
              ) : (
                <div className="flex w-full justify-between items-center border border-slate-400 dark:border-white rounded-lg p-4 font-extrabold space-y-0">
                  <div className="whitespace-nowrap text-xs">Coin Token</div>
                  <div className="w-full flex justify-end items-center">
                    <input
                      type="number"
                      min="0"
                      value={quantity || ''}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="bg-transparent outline-none text-right appearance-none w-32 sm:w-full"
                      placeholder="0"
                    ></input>
                    <div className="ml-2">Token</div>
                  </div>
                </div>
              )}
              <div className="flex justify-between text-center font-extrabold border border-slate-400 dark:border-white rounded-lg">
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
              <div className="border border-slate-400 dark:border-white  rounded-lg w-full p-3 flex justify-between font-extrabold text-xl items-center">
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
              <div className="flex w-full justify-between items-center border border-slate-400 dark:border-white  rounded-lg p-2 px-4 font-extrabold">
                <div className="whitespace-nowrap">Entry Price</div>
                <div className="w-full flex justify-end items-center">
                  <input
                    type="number"
                    // min=""
                    value={entryPrice || ''}
                    onChange={(e) => setentryPrice(Number(e.target.value))}
                    placeholder="0"
                    className="bg-transparent outline-none text-right appearance-none w-32 sm:w-full"
                  ></input>
                  <div className="ml-2">USD</div>
                </div>
              </div>
              <div className="flex w-full justify-between items-center border border-slate-400 dark:border-white  rounded-lg p-2 px-4 font-extrabold">
                <div className="whitespace-nowrap">Exit Price</div>
                <div className="w-full flex justify-end items-center">
                  <input
                    type="number"
                    min=""
                    placeholder="Optional"
                    value={exitPrice || ''}
                    onChange={(e) => setExitPrice(Number(e.target.value))}
                    // onChange={handleExitChange}
                    className="bg-transparent outline-none text-right appearance-none w-32 sm:w-full"
                  ></input>
                  <div className="ml-2">USD</div>
                </div>
              </div>
              {
                optionTrading === 'trading' ? (
                  <div className="flex w-full justify-between items-center border border-slate-400 dark:border-white  rounded-lg p-2 px-4 font-extrabold">
                    <div className="whitespace-nowrap">Quantity</div>
                    <div className="w-full flex justify-end items-center">
                      <input
                        readOnly
                        type="number"
                        min=""
                        value={quantity.toFixed(2) || ''}
                        // onChange={quantity}
                        placeholder=""
                        className="bg-transparent outline-none text-right appearance-none w-32 sm:w-full"
                      ></input>
                      <div className="ml-2">Tokens</div>
                    </div>
                  </div>
                ) : (
                  ''
                )
                // (
                //   <div className="flex w-full justify-between items-center border border-slate-400 dark:border-white  rounded-lg p-2 px-4 font-extrabold">
                //     <div className="whitespace-nowrap">Trading Size</div>
                //     <div className="w-full flex justify-end items-center">
                //       <input
                //         readOnly
                //         type="number"
                //         min=""
                //         value={
                //           tradingSize?.toFixed(getDecimalPlaces(tradingSize)) ||
                //           ''
                //         }
                //         // onChange={quantity}
                //         placeholder=""
                //         className="bg-transparent outline-none text-right appearance-none w-32 sm:w-full"
                //       ></input>
                //       <div className="ml-2">USD</div>
                //     </div>
                //   </div>
                // )
              }
            </div>
          </div>
        </div>
        <div>
          <div className="md:h-[544.04px] border w-full sm:w-[400px] p-5 rounded-lg bg-gray-100 dark:bg-[#202630] text-gray-900 dark:text-gray-100 border-slate-400 dark:border-white font-extrabold shadow-xl">
            <div className="w-full">
              <div className="space-y-5">
                <div className="flex justify-between">
                  <div className="">Result</div>
                  <button onClick={() => resetValue()}>
                    <ArrowPathIcon width={18} />
                  </button>
                </div>
                <div className="flex justify-between">
                  <span>Liquidation Price:</span>
                  <span>{liquidationPrice || ''} USD</span>{' '}
                </div>

                <div>
                  {roiPercentages.map((percentage) => {
                    const { validRoi, validPnl } = roiPnl(percentage)

                    return (
                      <div key={percentage}>
                        <div className="space-y-3 items-center mb-3">
                          <hr className="w-[60%] mx-auto border-t-2 border-gray-300 dark:border-gray-400 "></hr>
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
