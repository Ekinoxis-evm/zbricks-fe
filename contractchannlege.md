> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Create a challenge for contract execution

> Generates a challenge for creating a transaction which executes a smart contract. ABI parameters must be passed in the request.



## OpenAPI

````yaml openapi/user-controlled-wallets.yaml post /v1/w3s/user/transactions/contractExecution
openapi: 3.0.3
info:
  version: '1.0'
  title: User-Controlled Wallets
  description: User-Controlled Wallets API documentation.
servers:
  - url: https://api.circle.com
security:
  - BearerAuth: []
tags:
  - name: Social/ Email Authentication
  - name: PIN Authentication
  - name: Users
  - name: Wallets
  - name: Transactions
  - name: Token Lookup
  - name: Signing
paths:
  /v1/w3s/user/transactions/contractExecution:
    post:
      tags:
        - Transactions
      summary: Create a challenge for contract execution
      description: >-
        Generates a challenge for creating a transaction which executes a smart
        contract. ABI parameters must be passed in the request.
      operationId: createUserTransactionContractExecutionChallenge
      parameters:
        - $ref: '#/components/parameters/XUserToken'
        - $ref: '#/components/parameters/XRequestId'
      requestBody:
        $ref: >-
          #/components/requestBodies/CreateContractExecutionTransactionForEndUser
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/CreateContractExecutionTransactionForEndUserResponse
          description: The challenge for the contract execution was successfully created
          headers:
            X-Request-Id:
              $ref: '#/components/headers/XRequestId'
        '201':
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/CreateContractExecutionTransactionForEndUserResponse
          description: Successfully created a challenge for a contract execution
          headers:
            X-Request-Id:
              $ref: '#/components/headers/XRequestId'
        '400':
          $ref: '#/components/responses/DefaultError'
        '401':
          $ref: '#/components/responses/NotAuthorized'
        '404':
          $ref: '#/components/responses/NotFound'
      security:
        - BearerAuth: []
components:
  parameters:
    XUserToken:
      name: X-User-Token
      description: Unique system generated JWT session token for specific user.
      required: true
      in: header
      schema:
        type: string
    XRequestId:
      name: X-Request-Id
      in: header
      description: >
        Developer-provided identifier for this request, used for tracing
        requests in Wallets API logs and the Developer Console, and when
        communicating with Circle Support.

        **Must be a UUID to appear in logs.** Non-UUID values are accepted by
        the API but are ignored by logging and tracing systems.
      schema:
        $ref: '#/components/schemas/XRequestId'
  requestBodies:
    CreateContractExecutionTransactionForEndUser:
      content:
        application/json:
          schema:
            title: CreateContractExecutionTransactionForEndUserRequest
            type: object
            required:
              - contractAddress
              - idempotencyKey
              - walletId
            properties:
              idempotencyKey:
                $ref: '#/components/schemas/IdempotencyKey'
              abiFunctionSignature:
                $ref: '#/components/schemas/AbiFunctionSignature'
              abiParameters:
                $ref: '#/components/schemas/AbiParameters'
              callData:
                $ref: '#/components/schemas/CallData'
              amount:
                $ref: '#/components/schemas/Amount'
              contractAddress:
                $ref: '#/components/schemas/ContractAddress'
              feeLevel:
                $ref: '#/components/schemas/FeeLevel'
              gasLimit:
                $ref: '#/components/schemas/GasLimit'
              gasPrice:
                $ref: '#/components/schemas/GasPrice'
              maxFee:
                $ref: '#/components/schemas/MaxFee'
              priorityFee:
                $ref: '#/components/schemas/PriorityFee'
              refId:
                $ref: '#/components/schemas/TransactionReferenceId'
              walletId:
                $ref: '#/components/schemas/WalletId'
      description: Create transaction for end user request
      required: true
  schemas:
    CreateContractExecutionTransactionForEndUserResponse:
      title: CreateContractExecutionTransactionForEndUserResponse
      type: object
      properties:
        data:
          type: object
          required:
            - challengeId
          properties:
            challengeId:
              $ref: '#/components/schemas/ChallengeId'
    XRequestId:
      type: string
      format: uuid
      description: >-
        A unique identifier, which can be helpful for identifying a request when
        communicating with Circle support.
      example: 2adba88e-9d63-44bc-b975-9b6ae3440dde
    IdempotencyKey:
      type: string
      description: >-
        Universally unique identifier (UUID v4) idempotency key. This key is
        utilized to ensure exactly-once execution of mutating requests. To
        create a UUIDv4 go to
        [uuidgenerator.net](https://www.uuidgenerator.net). If the same key is
        reused, it will be treated as the same request and the original response
        will be returned.
      example: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
      format: uuid
    AbiFunctionSignature:
      title: AbiFunctionSignature
      type: string
      description: "The contract ABI function signature or\_`callData`\_field is required for interacting with the smart contract. The ABI function signature cannot be used simultaneously with\_`callData`. e.g. burn(uint256)"
      example: burn(uint256)
    AbiParameters:
      title: AbiParameters
      type: array
      items:
        anyOf:
          - type: string
          - type: integer
          - type: boolean
          - type: array
            items: {}
      description: "The contract ABI function signature parameters for executing the contract interaction. Supported parameter types include string, integer, boolean, and array. These parameters should be used exclusively with the abiFunctionSignature and cannot be used with\_`callData`."
      example:
        - '100'
        - '1'
    CallData:
      title: CallData
      type: string
      description: "The raw transaction data, must be an even-length hexadecimal string with the\_`0x`\_prefix, to be executed. It is important to note that the usage of\_`callData`\_is mutually exclusive with the\_`abiFunctionSignature`\_and\_`abiParameters`. Therefore,\_`callData`\_cannot be utilized simultaneously with either\_`abiFunctionSignature`\_or\_`abiParameters`."
      example: >-
        0xcdcd77c000000000000000000000000000000000000000000000000000000000000000450000000000000000000000000000000000000000000000000000000000000001
    Amount:
      title: Amount
      type: string
      description: >-
        The amount of native token that will be sent to the contract abi
        execution. Optional field for payable api only, if not provided, no
        native token will be sent.
      example: '1.0'
    ContractAddress:
      title: ContractAddress
      description: The blockchain address of the contract to be executed.
      type: string
      example: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
    FeeLevel:
      type: string
      enum:
        - LOW
        - MEDIUM
        - HIGH
      example: MEDIUM
      description: >
        A dynamic blockchain fee level setting (`LOW`, `MEDIUM`, or `HIGH`) that
        will be used to pay gas for the transaction. Calculated based on network
        traffic, supply of validators, and demand for transaction verification.
        Cannot be used with `gasPrice`, `priorityFee`, or `maxFee`.

        Estimates for each fee level can be obtained through the [`POST
        /transactions/transfer/estimateFee`](/api-reference/w3s/developer-controlled-wallets/create-transfer-estimate-fee)
        API.
    GasLimit:
      type: string
      description: >
        The maximum units of gas to use for the transaction. Required if
        `feeLevel` is not provided.

        Estimates for this limit can be obtained through the [`POST
        /transactions/transfer/estimateFee`](/api-reference/w3s/developer-controlled-wallets/create-transfer-estimate-fee)
        API.

        An insufficient gas limit may cause the transaction to fail on-chain.
        Use this field with care when manually providing values.

        GasLimit override (only supported for EOA wallets): Using `gasLimit`
        together with `feeLevel`, the provided `gasLimit` will override the
        estimation's gasLimit.
      example: '21000'
    GasPrice:
      type: string
      description: >
        For blockchains without EIP-1559 support, the maximum price of gas, in
        gwei, to use per each unit of gas (see `gasLimit`). Requires `gasLimit`.
        Cannot be used with `feeLevel`, `priorityFee`, or `maxFee`.

        Estimates for this fee can be obtained through the [`POST
        /transactions/transfer/estimateFee`](/api-reference/w3s/developer-controlled-wallets/create-transfer-estimate-fee)
        API.

        The wallet service enforces a dynamic minimum `gasPrice` based on
        current network conditions. Requests specifying a `gasPrice` below this
        minimum will be rejected
    MaxFee:
      type: string
      example: '5.935224468'
      description: >
        For blockchains with EIP-1559 support, the maximum price per unit of gas
        (see `gasLimit`), in gwei. Requires `priorityFee`, and `gasLimit` to be
        present. Cannot be used with `feeLevel` or `gasPrice`.

        Estimates for this fee can be obtained through the [`POST
        /transactions/transfer/estimateFee`](/api-reference/w3s/developer-controlled-wallets/create-transfer-estimate-fee)
        API.
    PriorityFee:
      type: string
      example: '1.022783914'
      description: >
        For blockchains with EIP-1559 support, the “tip”, in gwei, to add to the
        base fee as an incentive for validators.

        Please note that the `maxFee` and `gasLimit` parameters are required
        alongside the `priorityFee`. The `feeLevel` and `gasPrice` parameters
        cannot be used with the `priorityFee`. 

        Estimations for this fee can be obtained through the [`POST
        /transactions/transfer/estimateFee`](/api-reference/w3s/developer-controlled-wallets/create-transfer-estimate-fee)
        API.

        The wallet service enforces a dynamic minimum `priorityFee` based on
        current network conditions. Requests specifying a `priorityFee` below
        this minimum will be rejected
    TransactionReferenceId:
      type: string
      example: grouptransaction123
      description: Optional reference or description used to identify the transaction.
    WalletId:
      title: WalletId
      type: string
      format: uuid
      description: |
        Unique system generated identifier of the wallet.
        For contract deploys this wallet ID will be used as the source.
      example: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
    ChallengeId:
      type: string
      format: uuid
      description: >-
        Unique system generated identifier used to initiate a user challenge
        flow.
      example: c4d1da72-111e-4d52-bdbf-2e74a2d803d5
    Error:
      title: Error
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: integer
          description: Code that corresponds to the error.
        message:
          type: string
          description: Message that describes the error.
  headers:
    XRequestId:
      description: >
        Developer-provided header parameter or Circle-generated universally
        unique identifier (UUID v4). Useful for identifying a specific request
        when communicating with Circle Support.
      schema:
        $ref: '#/components/schemas/XRequestId'
  responses:
    DefaultError:
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
      description: Error response
      headers:
        X-Request-Id:
          $ref: '#/components/headers/XRequestId'
    NotAuthorized:
      content:
        application/json:
          schema:
            type: object
            title: NotAuthorizedResponse
            required:
              - code
              - message
            properties:
              code:
                type: integer
                description: Code that corresponds to the error.
              message:
                type: string
                description: Message that describes the error.
            example:
              code: 401
              message: Malformed authorization.
      description: >-
        Request has not been applied because it lacks valid authentication
        credentials.
      headers:
        X-Request-Id:
          $ref: '#/components/headers/XRequestId'
    NotFound:
      content:
        application/json:
          schema:
            type: object
            title: NotFoundResponse
            required:
              - code
              - message
            properties:
              code:
                type: integer
                description: Code that corresponds to the error.
              message:
                type: string
                description: Message that describes the error.
            example:
              code: 404
              message: Not found.
      description: Specified resource was not found.
      headers:
        X-Request-Id:
          $ref: '#/components/headers/XRequestId'
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: PREFIX:ID:SECRET
      description: >-
        Circle's API Keys are formatted in the following structure
        "PREFIX:ID:SECRET". All three parts are requred to make a successful
        request.

````

