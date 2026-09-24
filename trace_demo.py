customers = [
    {"id": 101, "transactions": [500, 2000, 3000]},
    {"id": 102, "transactions": [800, 1500]},
    {"id": 103, "transactions": [4000, 5000]}
]

qualified_customers = []

print("=== START DEBUGGER STEP-BY-STEP TRACE ===\n")

for i, customer in enumerate(customers, start=1):
    c_id = customer["id"]
    txns = customer["transactions"]
    print(f">> [BREAKPOINT 1: OUTER LOOP] (Customer #{i})")
    print(f"   Current Variable: customer = {{'id': {c_id}, 'transactions': {txns}}}")

    # Simulating what any(...) does under the hood
    matched = False
    for step_num, transaction in enumerate(txns, start=1):
        is_ge = transaction >= 3000
        print(f"      >> [BREAKPOINT 2: INSIDE any()] Checking item {step_num}: {transaction} >= 3000 ? -> {is_ge}")
        if is_ge:
            matched = True
            print(f"         [SHORT-CIRCUIT] True found! any(...) stops immediately here.")
            break

    print(f"\n   >> [BREAKPOINT 3: IF CONDITION]")
    print(f"   Condition result: {matched}")
    if matched:
        qualified_customers.append(c_id)
        print(f"   [ACTION] Included id {c_id} -> qualified_customers = {qualified_customers}")
    else:
        print(f"   [ACTION] Skipped id {c_id}  -> qualified_customers = {qualified_customers}")

    print("-" * 55)

print(f"\n=== FINAL OUTPUT ===: {qualified_customers}")
