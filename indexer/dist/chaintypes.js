(() => {
    "use strict";
    var e = {
        d: (t, r) => {
            for (var o in r) e.o(r, o) && !e.o(t, o) && Object.defineProperty(t, o, {
                enumerable: !0,
                get: r[o]
            });
        },
        o: (e, t) => Object.prototype.hasOwnProperty.call(e, t),
        r: e => {
            "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
                value: "Module"
            }), Object.defineProperty(e, "__esModule", {
                value: !0
            });
        }
    }, t = {};
    e.r(t), e.d(t, {
        default: () => r
    });
    const r = {
        typesBundle: {
            spec: {
                selendra: {
                    types: {
                        UnifiedAddress: {
                            _enum: {
                                Substrate: "AccountId32",
                                EVM: "H160"
                            }
                        },
                        AccountBinding: {
                            substrate_address: "AccountId32",
                            evm_address: "H160"
                        },
                        SessionAuthorityData: {
                            authorities: "Vec<(AuthorityId, AuthorityWeight)>",
                            emergency_finalizer: "Option<AuthorityId>"
                        },
                        AuthorityId: "[u8; 32]",
                        AuthorityWeight: "u64",
                        ValidatorPrefs: {
                            commission: "Perbill",
                            blocked: "bool"
                        },
                        EvmAddress: "H160",
                        EthTransaction: {
                            nonce: "U256",
                            gas_price: "U256",
                            gas_limit: "U256",
                            action: "TransactionAction",
                            value: "U256",
                            input: "Bytes",
                            signature: "TransactionSignature"
                        },
                        TransactionAction: {
                            _enum: {
                                Call: "H160",
                                Create: "Null"
                            }
                        },
                        TransactionSignature: {
                            v: "u64",
                            r: "H256",
                            s: "H256"
                        }
                    }
                }
            }
        }
    };
    var o = exports;
    for (var i in t) o[i] = t[i];
    t.__esModule && Object.defineProperty(o, "__esModule", {
        value: !0
    });
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhaW50eXBlcy5qcyIsIm1hcHBpbmdzIjoiOztJQUNBLElBQUlBLElBQXNCO1FDQTFCQSxHQUF3QixDQUFDQyxHQUFTQztZQUNqQyxLQUFJLElBQUlDLEtBQU9ELEdBQ1hGLEVBQW9CSSxFQUFFRixHQUFZQyxPQUFTSCxFQUFvQkksRUFBRUgsR0FBU0UsTUFDNUVFLE9BQU9DLGVBQWVMLEdBQVNFLEdBQUs7Z0JBQUVJLGFBQVk7Z0JBQU1DLEtBQUtOLEVBQVdDOzs7UUNKM0VILEdBQXdCLENBQUNTLEdBQUtDLE1BQVVMLE9BQU9NLFVBQVVDLGVBQWVDLEtBQUtKLEdBQUtDO1FDQ2xGVixHQUF5QkM7WUFDSCxzQkFBWGEsVUFBMEJBLE9BQU9DLGVBQzFDVixPQUFPQyxlQUFlTCxHQUFTYSxPQUFPQyxhQUFhO2dCQUFFQyxPQUFPO2dCQUU3RFgsT0FBT0MsZUFBZUwsR0FBUyxjQUFjO2dCQUFFZSxRQUFPOzs7Ozs7O0lDTHZEO1FBQWdCQyxhQUFZO1lBQUNDLE1BQUs7Z0JBQUNDLFVBQVM7b0JBQUNDLE9BQU07d0JBQUNDLGdCQUFlOzRCQUFDQyxPQUFNO2dDQUFDQyxXQUFVO2dDQUFjQyxLQUFJOzs7d0JBQVNDLGdCQUFlOzRCQUFDQyxtQkFBa0I7NEJBQWNDLGFBQVk7O3dCQUFRQyxzQkFBcUI7NEJBQUNDLGFBQVk7NEJBQXNDQyxxQkFBb0I7O3dCQUF1QkMsYUFBWTt3QkFBV0MsaUJBQWdCO3dCQUFNQyxnQkFBZTs0QkFBQ0MsWUFBVzs0QkFBVUMsU0FBUTs7d0JBQVFDLFlBQVc7d0JBQU9DLGdCQUFlOzRCQUFDQyxPQUFNOzRCQUFPQyxXQUFVOzRCQUFPQyxXQUFVOzRCQUFPQyxRQUFPOzRCQUFvQnpCLE9BQU07NEJBQU8wQixPQUFNOzRCQUFRQyxXQUFVOzt3QkFBd0JDLG1CQUFrQjs0QkFBQ3RCLE9BQU07Z0NBQUN1QixNQUFLO2dDQUFPQyxRQUFPOzs7d0JBQVNDLHNCQUFxQjs0QkFBQ0MsR0FBRTs0QkFBTUMsR0FBRTs0QkFBT0MsR0FBRSIsInNvdXJjZXMiOlsid2VicGFjazovL0BzZWxlbmRyYS90ZXJtaW5hbC1pbmRleGVyL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL0BzZWxlbmRyYS90ZXJtaW5hbC1pbmRleGVyL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9Ac2VsZW5kcmEvdGVybWluYWwtaW5kZXhlci93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL0BzZWxlbmRyYS90ZXJtaW5hbC1pbmRleGVyL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vQHNlbGVuZHJhL3Rlcm1pbmFsLWluZGV4ZXIvLi9jaGFpbnR5cGVzLnlhbWwiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gVGhlIHJlcXVpcmUgc2NvcGVcbnZhciBfX3dlYnBhY2tfcmVxdWlyZV9fID0ge307XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJleHBvcnQgZGVmYXVsdCB7dHlwZXNCdW5kbGU6e3NwZWM6e3NlbGVuZHJhOnt0eXBlczp7VW5pZmllZEFkZHJlc3M6e19lbnVtOntTdWJzdHJhdGU6J0FjY291bnRJZDMyJyxFVk06J0gxNjAnfX0sQWNjb3VudEJpbmRpbmc6e3N1YnN0cmF0ZV9hZGRyZXNzOidBY2NvdW50SWQzMicsZXZtX2FkZHJlc3M6J0gxNjAnfSxTZXNzaW9uQXV0aG9yaXR5RGF0YTp7YXV0aG9yaXRpZXM6J1ZlYzwoQXV0aG9yaXR5SWQsIEF1dGhvcml0eVdlaWdodCk+JyxlbWVyZ2VuY3lfZmluYWxpemVyOidPcHRpb248QXV0aG9yaXR5SWQ+J30sQXV0aG9yaXR5SWQ6J1t1ODsgMzJdJyxBdXRob3JpdHlXZWlnaHQ6J3U2NCcsVmFsaWRhdG9yUHJlZnM6e2NvbW1pc3Npb246J1BlcmJpbGwnLGJsb2NrZWQ6J2Jvb2wnfSxFdm1BZGRyZXNzOidIMTYwJyxFdGhUcmFuc2FjdGlvbjp7bm9uY2U6J1UyNTYnLGdhc19wcmljZTonVTI1NicsZ2FzX2xpbWl0OidVMjU2JyxhY3Rpb246J1RyYW5zYWN0aW9uQWN0aW9uJyx2YWx1ZTonVTI1NicsaW5wdXQ6J0J5dGVzJyxzaWduYXR1cmU6J1RyYW5zYWN0aW9uU2lnbmF0dXJlJ30sVHJhbnNhY3Rpb25BY3Rpb246e19lbnVtOntDYWxsOidIMTYwJyxDcmVhdGU6J051bGwnfX0sVHJhbnNhY3Rpb25TaWduYXR1cmU6e3Y6J3U2NCcscjonSDI1NicsczonSDI1Nid9fX19fX07Il0sIm5hbWVzIjpbIl9fd2VicGFja19yZXF1aXJlX18iLCJleHBvcnRzIiwiZGVmaW5pdGlvbiIsImtleSIsIm8iLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImVudW1lcmFibGUiLCJnZXQiLCJvYmoiLCJwcm9wIiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwiU3ltYm9sIiwidG9TdHJpbmdUYWciLCJ2YWx1ZSIsInR5cGVzQnVuZGxlIiwic3BlYyIsInNlbGVuZHJhIiwidHlwZXMiLCJVbmlmaWVkQWRkcmVzcyIsIl9lbnVtIiwiU3Vic3RyYXRlIiwiRVZNIiwiQWNjb3VudEJpbmRpbmciLCJzdWJzdHJhdGVfYWRkcmVzcyIsImV2bV9hZGRyZXNzIiwiU2Vzc2lvbkF1dGhvcml0eURhdGEiLCJhdXRob3JpdGllcyIsImVtZXJnZW5jeV9maW5hbGl6ZXIiLCJBdXRob3JpdHlJZCIsIkF1dGhvcml0eVdlaWdodCIsIlZhbGlkYXRvclByZWZzIiwiY29tbWlzc2lvbiIsImJsb2NrZWQiLCJFdm1BZGRyZXNzIiwiRXRoVHJhbnNhY3Rpb24iLCJub25jZSIsImdhc19wcmljZSIsImdhc19saW1pdCIsImFjdGlvbiIsImlucHV0Iiwic2lnbmF0dXJlIiwiVHJhbnNhY3Rpb25BY3Rpb24iLCJDYWxsIiwiQ3JlYXRlIiwiVHJhbnNhY3Rpb25TaWduYXR1cmUiLCJ2IiwiciIsInMiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==