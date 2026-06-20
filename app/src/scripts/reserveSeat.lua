--[[
  reserveSeat.lua
  ---------------
  Atomically checks and decrements a seat counter stored as a Redis string.

  KEYS[1] : The seat inventory key
             e.g. "seat_inventory:5:2025-08-01:AC3"

  Return values:
    {1, remaining}  — reservation succeeded; `remaining` is the count after decrement
    {0}             — no seats available (sold out)
    {-1}            — key does not exist in Redis (inventory not loaded)

  The entire check-and-decrement runs as a single atomic Redis operation,
  so no two concurrent callers can read the same non-zero value and both decrement.
--]]

local current = redis.call('GET', KEYS[1])

-- Key missing: inventory was never loaded into Redis
if current == false then
  return {-1}
end

local count = tonumber(current)

-- No seats left
if count <= 0 then
  return {0}
end

-- Decrement and return updated count
local remaining = redis.call('DECR', KEYS[1])
return {1, remaining}
